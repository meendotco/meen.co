<script lang="ts">
	import type { TextStreamPart } from 'ai';
	import type { InferSelectModel } from 'drizzle-orm';
	import { uuid } from 'drizzle-orm/gel-core';
	import { Send, Trash2 } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import { page } from '$app/state';
	import Messages from '$lib/components/Messages.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input';
	import type {
		chatMessage as chatMessageTable,
		toolcall as toolcallTable
	} from '$lib/server/db/schema';
	import { socket } from '$lib/websocket/client.svelte.js';

	type MessageChunk = {
		id: string;
		chunk: TextStreamPart<any>;
	};

	type ToolcallSelect = InferSelectModel<typeof toolcallTable>;
	type MessageSelect = InferSelectModel<typeof chatMessageTable> & {
		toolcalls: ToolcallSelect[];
		messageChunks: MessageChunk[];
	};

	let {
		jobId,
		chatId,
		initialMessages = []
	} = $props<{
		jobId: string;
		chatId: string | null;
		initialMessages?: MessageSelect[];
	}>();

	let errorMessage = $state<string | null>(null);
	let chatDisabled = $state(false);
	let message = $state('');
	let messages = $state<MessageSelect[]>([...initialMessages]);

	async function sendMessage(messageToSend: string) {
		if (!messageToSend.trim() || chatDisabled || !chatId) return;

		const newMessage: MessageSelect = {
			id: crypto.randomUUID(),
			content: messageToSend,
			role: 'user',
			createdAt: new Date(),
			chatId: chatId,
			toolcalls: [],
			messageChunks: []
		};
		messages.push(newMessage);

		await fetch(`/api/job/${jobId}/chat`, {
			method: 'POST',
			body: JSON.stringify({ message: messageToSend })
		});
		message = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey && message.trim() && !chatDisabled) {
			event.preventDefault();
			sendMessage(message);
		}
	}

	onMount(() => {
		if (!jobId) return;

		socket.on(
			`${jobId}.messageChunk`,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(data: { chunk: TextStreamPart<any>; appPayload: { jobId: string; messageId: string } }) => {
				const chunk = data.chunk;
				const messageId = data.appPayload.messageId;
				const messageIndex = messages.findIndex((m) => m.id === messageId);

				if (messageIndex === -1) return;

				if (chunk.type === 'text-delta' && typeof chunk.textDelta === 'string') {
					if (messages[messageIndex].content === null) {
						messages[messageIndex].content = chunk.textDelta;
					} else {
						messages[messageIndex].content += chunk.textDelta;
					}
				} else if (chunk.type === 'tool-result' && chunk.toolCallId && chunk.toolName) {
					const newToolCall: ToolcallSelect = {
						id: chunk.toolCallId,
						chatMessageId: messageId,
						name: chunk.toolName,
						args: chunk.args as Record<string, unknown>,
						result:
							(chunk.result as Record<string, unknown> | boolean | number | string | null) ?? null,
						createdAt: new Date()
					};
					messages[messageIndex].toolcalls.push(newToolCall);
				}
				messages[messageIndex].messageChunks.push({
					id: crypto.randomUUID(),
					chunk: chunk
				});
				if (chunk.type === 'error') {
					chatDisabled = false;
					errorMessage =
						typeof chunk.error === 'object' && chunk.error
							? `${(chunk.error as Record<string, string>).name || 'Error'}: ${(chunk.error as Record<string, string>).reason || 'Unknown error'}`
							: 'An unknown error occurred';
				}
				if (chunk.type === 'finish') {
					chatDisabled = false;
					errorMessage = null;
				}
			}
		);

		socket.on(
			`${jobId}.messageStarted`,
			(data: { appPayload: { jobId: string; messageId: string } }) => {
				chatDisabled = true;
				errorMessage = null;
				if (!chatId) return;

				messages.push({
					id: data.appPayload.messageId,
					content: null,
					role: 'assistant',
					createdAt: new Date(),
					chatId: chatId,
					toolcalls: [],
					messageChunks: []
				} satisfies MessageSelect);
			}
		);

		socket.on(
			`${jobId}.messageComplete`,
			(data: { appPayload: { jobId: string; messageId: string } }) => {
				if (data.appPayload.jobId !== page.params.jobId) {
					// Note: Accessing page.params directly might not be ideal in a lib component.
					// Consider passing jobId if needed, but here it seems redundant as we already have jobId prop.
					// Let's simplify this check.
					if (data.appPayload.jobId !== jobId) {
						return;
					}
					chatDisabled = false;
				}
			}
		);
	});

	async function deleteMessages() {
		if (!jobId || !chatId) return;
		const prevMessages = messages;
		messages = [];
		const response = await fetch(`/api/job/${jobId}/chat`, {
			method: 'DELETE'
		});
		if (!response.ok) {
			toast.error('Error deleting messages');
			messages = prevMessages;
		} else {
			toast.success('Messages deleted');
		}
	}
</script>

<div class="flex h-full flex-col">
	<div
		class="flex items-center justify-between border-b border-l bg-muted/20 px-3 py-2 sm:px-4 sm:py-3"
	>
		<h2 class="flex items-center gap-2 text-xs font-medium sm:text-sm">
			<div
				class="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-6 sm:w-6"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-3 w-3 sm:h-3.5 sm:w-3.5"
					><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg
				>
			</div>
			AI Assistant
		</h2>
		<Button
			onclick={deleteMessages}
			title="Clear Chat History"
			variant="ghost"
			size="icon"
			disabled={messages.length === 0}
			class="h-6 w-6 text-muted-foreground hover:text-destructive sm:h-7 sm:w-7"
		>
			<Trash2 class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
		</Button>
	</div>

	<div class="h-0 flex-1 overflow-y-auto p-3 sm:p-4">
		<Messages {messages} {errorMessage} />
	</div>

	<div class="flex-none border-t p-2 sm:p-3">
		<div class="flex items-center gap-2 rounded-md border bg-background p-1 pl-2 sm:pl-3">
			<Input
				bind:value={message}
				onkeydown={handleKeydown}
				placeholder="Message AI assistant..."
				class="flex-1 border-0 bg-transparent py-1 text-xs shadow-none focus-visible:ring-transparent sm:py-1.5 sm:text-sm"
				disabled={chatDisabled}
			/>
			<Button
				size="sm"
				variant={message.trim() ? 'default' : 'ghost'}
				onclick={() => sendMessage(message)}
				disabled={chatDisabled || !message.trim()}
				class="h-6 w-6 rounded-md p-0 sm:h-8 sm:w-8"
				title="Send message"
			>
				<Send class="h-3 w-3 sm:h-4 sm:w-4" />
			</Button>
		</div>
		<p class="mt-1 text-center text-[10px] text-muted-foreground sm:mt-2 sm:text-xs">
			Ask about finding candidates or job details
		</p>
	</div>
</div>
