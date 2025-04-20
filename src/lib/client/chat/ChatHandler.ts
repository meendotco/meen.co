import type { TextStreamPart } from 'ai';

import type { Message, ToolCallData } from '$lib/types/chat';
import { socket } from '$lib/websocket/client.svelte.js';

// Helper type for casting tool result chunks
interface ToolResultChunk {
	type: 'tool-result';
	toolCallId: string;
	toolName: string;
	args: Record<string, unknown>;
	result: Record<string, unknown> | boolean | number | string | null;
}

export class ChatHandler {
	jobId = $state('');
	messages = $state<Message[]>([]);
	message = $state('');
	errorMessage = $state<string | null>(null);
	chatDisabled = $state(false);

	// Use Function or any[] for broader listener compatibility if unknown[] fails
	#listeners: Record<string, Function> = {};

	constructor(jobId: string, initialMessages: Message[] | undefined) {
		this.jobId = jobId;
		this.messages = initialMessages ?? [];
		this.#registerSocketListeners();
	}

	async sendMessage() {
		if (!this.message.trim() || this.chatDisabled) return;

		const messageToSend = this.message;
		this.message = '';

		if (!Array.isArray(this.messages)) {
			this.messages = [];
		}

		this.messages.push({
			id: crypto.randomUUID(),
			content: messageToSend,
			role: 'user',
			createdAt: new Date(),
			chatId: this.jobId ? `${this.jobId}-chat` : '',
			toolcalls: []
		});

		if (!this.jobId) {
			this.errorMessage = 'Error: Job ID is missing.';
			return;
		}

		try {
			const response = await fetch(`/api/job/${this.jobId}/chat`, {
				method: 'POST',
				body: JSON.stringify({ message: messageToSend })
			});
			if (!response.ok) {
				console.error('Failed to send message:', response.statusText);
				this.errorMessage = 'Failed to send message. Please try again.';
			}
		} catch (error) {
			console.error('Error sending message:', error);
			this.errorMessage = 'An error occurred while sending the message.';
		}
	}

	handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey && this.message.trim() && !this.chatDisabled) {
			event.preventDefault();
			this.sendMessage();
		}
	}

	#registerSocketListeners() {
		const handleMessageChunk = (data: {
			chunk: TextStreamPart<unknown>;
			appPayload: { jobId: string; messageId: string };
		}) => {
			if (data.appPayload.jobId !== this.jobId) return;

			const chunk = data.chunk;
			const lastMessage = this.messages[this.messages.length - 1];

			if (!lastMessage || lastMessage.id !== data.appPayload.messageId) {
				return;
			}

			if (chunk.type === 'text-delta' && typeof chunk.textDelta === 'string') {
				lastMessage.content = (lastMessage.content || '') + chunk.textDelta;
			} else if (chunk.type === 'tool-result') {
				// Cast to helper type within the block
				const toolChunk = chunk as ToolResultChunk;
				if (toolChunk.toolCallId && toolChunk.toolName) {
					const newToolCall: ToolCallData = {
						id: toolChunk.toolCallId,
						chatMessageId: lastMessage.id,
						name: toolChunk.toolName,
						args: toolChunk.args as Record<string, unknown>,
						result: toolChunk.result ?? null,
						createdAt: new Date()
					};
					if (!Array.isArray(lastMessage.toolcalls)) {
						lastMessage.toolcalls = [];
					}
					lastMessage.toolcalls.push(newToolCall);
				}
			} else if (chunk.type === 'error') {
				this.chatDisabled = false;
				this.errorMessage =
					typeof chunk.error === 'object' && chunk.error && 'message' in chunk.error
						? String(chunk.error.message)
						: 'An unknown error occurred';
			}
		};

		const handleMessageStarted = (data: { appPayload: { jobId: string; messageId: string } }) => {
			if (data.appPayload.jobId !== this.jobId) return;

			this.chatDisabled = true;
			this.errorMessage = null;

			if (!this.messages.some((m) => m.id === data.appPayload.messageId)) {
				this.messages.push({
					id: data.appPayload.messageId,
					content: '',
					role: 'assistant',
					createdAt: new Date(),
					chatId: this.jobId ? `${this.jobId}-chat` : '',
					toolcalls: []
				});
			}
		};

		const handleMessageComplete = (data: { appPayload: { jobId: string; messageId: string } }) => {
			if (data.appPayload.jobId !== this.jobId) return;
			this.chatDisabled = false;
		};

		this.#listeners[`${this.jobId}.messageChunk`] = handleMessageChunk;
		this.#listeners[`${this.jobId}.messageStarted`] = handleMessageStarted;
		this.#listeners[`${this.jobId}.messageComplete`] = handleMessageComplete;

		socket.on(`${this.jobId}.messageChunk`, handleMessageChunk);
		socket.on(`${this.jobId}.messageStarted`, handleMessageStarted);
		socket.on(`${this.jobId}.messageComplete`, handleMessageComplete);
	}

	cleanup() {
		for (const eventName in this.#listeners) {
			socket.off(eventName, this.#listeners[eventName]);
		}
		this.#listeners = {};
	}
}

// --- Helper Functions (Consider moving to src/lib/utils.ts) ---

export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: 'numeric'
	}).format(new Date(date));
}

export function getScoreColor(score?: number | null): string {
	if (score === undefined || score === null) return 'bg-gray-300 dark:bg-gray-700';
	if (score >= 8) return 'bg-green-500';
	if (score >= 6) return 'bg-yellow-500';
	return 'bg-red-500';
}
