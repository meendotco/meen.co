<script lang="ts">
	import type { TextStreamPart } from 'ai';
	import { formatDistanceToNow } from 'date-fns';
	import type { InferSelectModel } from 'drizzle-orm';
	import { ArrowLeft, Send, Trash2 } from 'lucide-svelte';
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CandidateCard from '$lib/components/CandidateCard.svelte';
	import Messages from '$lib/components/Messages.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Resizable from '$lib/components/ui/resizable';
	import Markdown from '$lib/markdown/Markdown.svelte';
	import type {
		candidates as candidatesTable,
		chat as chatTable,
		chatMessage as chatMessageTable,
		jobPost as jobPostTable,
		linkedInProfile as linkedInProfileTable,
		toolcall as toolcallTable
	} from '$lib/server/db/schema';
	import { socket } from '$lib/websocket/client.svelte.js';

	let errorMessage = $state<string | null>(null);
	let chatDisabled = $state(false);

	type JobPostSelect = InferSelectModel<typeof jobPostTable>;
	type LinkedInProfileSelect = InferSelectModel<typeof linkedInProfileTable>;
	type CandidateSelect = InferSelectModel<typeof candidatesTable> & {
		linkedInProfile: LinkedInProfileSelect | null;
	};
	type ToolcallSelect = InferSelectModel<typeof toolcallTable>;
	type MessageSelect = InferSelectModel<typeof chatMessageTable> & {
		toolcalls: ToolcallSelect[];
	};
	type ChatSelect = InferSelectModel<typeof chat> & {
		messages: MessageSelect[];
	};
	type FullJobData = JobPostSelect & {
		candidates: CandidateSelect[];
		chat: ChatSelect | null; // Chat can be null initially
	};

	let { data } = $props<{ data: { job: FullJobData } }>();
	let job = $derived(data.job);
	let candidates = $derived<CandidateSelect[]>(job?.candidates ?? []);
	let message = $state('');
	let messages = $state<MessageSelect[]>(data.job?.chat?.messages ?? []);

	let jobCreatedAtFormatted = $derived(
		job?.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : ''
	);

	async function sendMessage(messageToSend: string) {
		if (!messageToSend.trim() || chatDisabled) return;
		if (!job?.chat?.id) return; // Ensure chat ID exists

		const newMessage: MessageSelect = {
			id: crypto.randomUUID(),
			content: messageToSend,
			role: 'user',
			createdAt: new Date(),
			chatId: job.chat.id,
			toolcalls: []
		};
		messages.push(newMessage);

		if (!job?.id) {
			return;
		}
		await fetch(`/api/job/${job.id}/chat`, {
			method: 'POST',
			body: JSON.stringify({ message: messageToSend })
		});
		message = '';
	}

	// Handle keydown event for input
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey && message.trim() && !chatDisabled) {
			event.preventDefault();
			sendMessage(message);
		}
	}

	onMount(() => {
		if (!job?.id) return;

		socket.on(
			`${job.id}.messageChunk`,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(data: { chunk: TextStreamPart<any>; appPayload: { jobId: string; messageId: string } }) => {
				const chunk = data.chunk;
				const messageId = data.appPayload.messageId;
				const messageIndex = messages.findIndex((m) => m.id === messageId);

				if (messageIndex === -1) return; // Message might not exist yet if started event hasn't processed

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
				if (chunk.type === 'error') {
					chatDisabled = false;
					errorMessage =
						typeof chunk.error === 'object' && chunk.error
							? `${(chunk.error as Record<string, string>).name || 'Error'}: ${(chunk.error as Record<string, string>).reason || 'Unknown error'}`
							: 'An unknown error occurred';
				}
			}
		);

		socket.on(
			`${job.id}.messageStarted`,
			(data: { appPayload: { jobId: string; messageId: string } }) => {
				chatDisabled = true;
				errorMessage = null;
				if (!job?.chat?.id) return; // Ensure chat ID exists

				messages.push({
					id: data.appPayload.messageId,
					content: null, // Start with null content
					role: 'assistant',
					createdAt: new Date(),
					chatId: job.chat.id,
					toolcalls: []
				} satisfies MessageSelect);
			}
		);

		socket.on(
			`${job.id}.messageComplete`,
			(data: { appPayload: { jobId: string; messageId: string } }) => {
				if (data.appPayload.jobId !== page.params.jobId) {
					return;
				}
				chatDisabled = false;
			}
		);
	});

	async function deleteMessages() {
		if (!job?.id || !job?.chat?.id) return;
		const prevMessages = messages;
		messages = [];
		const response = await fetch(`/api/job/${job.id}/chat`, {
			method: 'DELETE'
		});
		if (!response.ok) {
			messages = prevMessages;
		}
	}
</script>

<div class="flex h-screen flex-col overflow-hidden bg-background">
	{#if job}
		<Resizable.PaneGroup direction="horizontal" class="h-full">
			<Resizable.Pane defaultSize={75} class="flex flex-col p-4">
				<div class="flex-1 space-y-6 overflow-y-auto pr-2">
					<Button variant="outline" onclick={() => goto('/dashboard/job')}>
						<ArrowLeft class="h-4 w-4" />
					</Button>
					<Card>
						<CardHeader>
							<CardTitle>Job Details</CardTitle>
						</CardHeader>
						<CardContent class="space-y-2">
							<div class="flex flex-wrap gap-2">
								{#if job.location}
									<Badge variant="secondary">{job.location}</Badge>
								{/if}
								{#if job.employmentType}
									<Badge variant="secondary">{job.employmentType}</Badge>
								{/if}
								{#if job.isRemote}
									<Badge variant="secondary">Remote</Badge>
								{/if}
								<Badge variant="outline">Posted: {jobCreatedAtFormatted}</Badge>
							</div>
						</CardContent>
					</Card>
					{#if job.description}
						<Card>
							<CardHeader>
								<CardTitle>Job Description</CardTitle>
							</CardHeader>
							<CardContent>
								<div class="prose prose-sm dark:prose-invert max-w-none">
									<Markdown md={job.description} />
								</div>
							</CardContent>
						</Card>
					{/if}

					<h2 class="text-2xl font-semibold">Candidates ({candidates.length})</h2>
					{#if candidates.length > 0}
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{#each candidates as candidate (candidate.id)}
								<CandidateCard {candidate} />
							{/each}
						</div>
					{:else}
						<p class="text-muted-foreground">No candidates found for this job yet.</p>
					{/if}
				</div>
			</Resizable.Pane>

			<Resizable.Handle withHandle />

			<Resizable.Pane defaultSize={25} minSize={20} maxSize={40}>
				<div class="flex h-full flex-col border-l bg-muted/40 p-4">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-semibold">Recruiter Agent Chat</h2>
						<Button
							onclick={deleteMessages}
							title="Clear Chat History"
							variant="outline"
							size="icon"
							disabled={messages.length === 0}
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>
					<Messages {messages} {errorMessage} />
					<div class="mt-4 flex items-center gap-2 border-t pt-4">
						<Input
							bind:value={message}
							onkeydown={handleKeydown}
							placeholder="Type your message..."
							class="flex-1"
							disabled={chatDisabled}
						/>
						<Button
							size="icon"
							onclick={() => sendMessage(message)}
							disabled={chatDisabled || !message.trim()}
						>
							<Send class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</Resizable.Pane>
		</Resizable.PaneGroup>
	{:else}
		<div class="flex h-screen items-center justify-center bg-background">
			<Card class="w-full max-w-md shadow-lg">
				<CardContent class="flex items-center justify-center p-8">
					<p class="text-muted-foreground">
						Job not found or you do not have permission to view it.
					</p>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
