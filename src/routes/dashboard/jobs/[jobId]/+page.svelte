<script lang="ts">
	import type { TextStreamPart } from 'ai';
	import { ArrowRight, Briefcase, Clock, MessageSquare, Users } from 'lucide-svelte';
	import { onMount } from 'svelte';

	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import Markdown from '$lib/markdown/Markdown.svelte';
	import { socket } from '$lib/websocket/client.svelte.js';

	let errorMessage = $state<string | null>(null);
	let chatDisabled = $state(false);
	// Define data structure interfaces
	interface LinkedInProfileData {
		first_name?: string;
		last_name?: string;
		headline?: string;
		profile_pic_url?: string;
	}

	interface Candidate {
		id: string;
		linkedInProfile: {
			data: LinkedInProfileData;
			url?: string;
			profileImageB64?: string;
		};
		reasoning?: string | null;
		matchScore?: number | null;
		handle?: string | null;
	}

	interface Message {
		id: string;
		content: string;
		role: 'assistant' | 'user';
		createdAt: Date;
		chatId: string;
		toolcalls: ToolCallData[];
	}

	interface ToolCallData {
		id: string;
		name: string;
		args: Record<string, unknown>;
		result: Record<string, unknown> | boolean | number | string | null;
		createdAt: Date;
		chatMessageId: string;
	}

	let { data } = $props();
	let job = $derived(data.job);
	let candidates = $derived<Candidate[]>((job?.candidates as Candidate[]) ?? []);
	let showFullDescription = $state(false);
	let message = $state('');
	let messages = $derived(data.job?.chat?.messages ?? []);
	async function sendMessage(messageToSend: string) {
		messages.push({
			id: crypto.randomUUID(),
			content: messageToSend,
			role: 'user',
			createdAt: new Date(),
			chatId: job?.chat?.id ?? '',
			toolcalls: []
		} satisfies Message);
		if (!job?.id) {
			return;
		}
		await fetch(`/api/jobs/${job.id}/chat`, {
			method: 'POST',
			body: JSON.stringify({ message })
		});
		message = '';
	}

	function getScoreColor(score?: number | null) {
		if (score === undefined || score === null) return 'bg-gray-300 dark:bg-gray-700';
		if (score >= 8) return 'bg-green-500';
		if (score >= 6) return 'bg-yellow-500';
		return 'bg-red-500';
	}

	function formatDate(date: Date) {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: 'numeric'
		}).format(new Date(date));
	}

	onMount(() => {
		socket.on(
			'messageChunk',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(data: { chunk: TextStreamPart<any>; appPayload: { jobId: string; messageId: string } }) => {
				const chunk = data.chunk;
				const payload = data.appPayload;
				if (payload.jobId !== job?.id) {
					return;
				}

				if (chunk.type === 'text-delta' && typeof chunk.textDelta === 'string') {
					messages[messages.length - 1].content =
						(messages[messages.length - 1].content || '') + chunk.textDelta;
				} else if (chunk.type === 'tool-result' && chunk.toolCallId && chunk.toolName) {
					const newToolCall: ToolCallData = {
						id: chunk.toolCallId,
						chatMessageId: messages[messages.length - 1].id,
						name: chunk.toolName,
						args: chunk.args as Record<string, unknown>,
						result:
							(chunk.result as Record<string, unknown> | boolean | number | string | null) ?? null,
						createdAt: new Date()
					};
					messages[messages.length - 1].toolcalls.push(newToolCall);
				}
				if (chunk.type === 'error') {
					chatDisabled = false;
					errorMessage =
						typeof chunk.error === 'object' && chunk.error
							? `${(chunk.error as any).name || 'Error'}: ${(chunk.error as any).reason || 'Unknown error'}`
							: 'An unknown error occurred';
				}
			}
		);

		socket.on('messageStarted', (data: { appPayload: { jobId: string; messageId: string } }) => {
			if (data.appPayload.jobId !== job?.id) {
				return;
			}
			chatDisabled = true;

			messages.push({
				id: data.appPayload.messageId,
				content: '',
				role: 'assistant',
				createdAt: new Date(),
				chatId: job?.chat?.id ?? '',
				toolcalls: []
			} satisfies Message);
		});

		socket.on('messageComplete', (data: { appPayload: { jobId: string; messageId: string } }) => {
			if (data.appPayload.jobId !== job?.id) {
				return;
			}
			chatDisabled = false;
			errorMessage = null;
		});
	});

	async function deleteChat() {
		if (!job?.id) {
			return;
		}
		const oldMessages = messages;
		messages = [];

		const response = await fetch(`/api/jobs/${job.id}/chat/delete`, {
			method: 'POST'
		});
		if (!response.ok) {
			messages = oldMessages;
		}
	}
</script>

<div class="flex h-screen flex-col overflow-hidden">
	{#if job}
		<div class="border-b border-border bg-card p-4">
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div class="flex items-center gap-4">
					<div>
						<div class="flex flex-row gap-2">
							<Button variant="outline" href="/dashboard/jobs" class="gap-2">
								<ArrowRight class="h-4 w-4 rotate-180" />
								All Jobs
							</Button>

							<h1 class="text-2xl font-bold tracking-tight">{job.title}</h1>
						</div>
						<div class="mt-1 flex items-center gap-2">
							<Clock class="h-4 w-4 text-muted-foreground" />
							<span class="text-sm text-muted-foreground">
								Created on {formatDate(new Date(job.createdAt || new Date()))}
							</span>
							<span class="px-2 text-sm text-muted-foreground">•</span>
							<span class="text-sm text-muted-foreground">
								AI uses this job description to find the best candidates
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="flex flex-1 overflow-hidden">
			<div class="hidden w-80 overflow-y-auto border-r border-border md:block">
				<div class="border-b border-border p-4">
					<h2 class="flex items-center gap-2 text-lg font-medium">
						<Users class="h-5 w-5 text-primary" />
						Candidates
					</h2>
					<p class="text-sm text-muted-foreground">
						{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} for this position
					</p>
				</div>

				{#if candidates.length > 0}
					<div class="divide-y divide-border">
						{#each candidates as candidate (candidate.id)}
							<div class="p-4 transition-colors hover:bg-muted/40">
								<div class="flex items-start justify-between">
									<div class="flex flex-1 gap-3">
										<div class="h-10 w-10 overflow-hidden rounded-full bg-muted">
											{#if candidate.linkedInProfile.profileImageB64}
												<img
													src={`data:image/jpeg;base64,${candidate.linkedInProfile.profileImageB64}`}
													alt="Profile"
													class="h-full w-full object-cover"
												/>
											{:else}
												<div
													class="flex h-full w-full items-center justify-center bg-primary/10 text-primary"
												>
													{candidate.linkedInProfile.data?.first_name?.[0] || ''}
													{candidate.linkedInProfile.data?.last_name?.[0] || ''}
												</div>
											{/if}
										</div>
										<div>
											<h3 class="text-sm font-medium">
												{candidate.linkedInProfile.data?.first_name || 'N/A'}
												{candidate.linkedInProfile.data?.last_name || ''}
											</h3>
											<p class="line-clamp-1 text-xs text-muted-foreground">
												{candidate.linkedInProfile.data?.headline || 'No headline'}
											</p>
										</div>
									</div>
									{#if candidate.matchScore !== null && candidate.matchScore !== undefined}
										<div class="ml-2 flex items-center gap-1.5">
											<div
												class={`h-2.5 w-2.5 rounded-full ${getScoreColor(candidate.matchScore)}`}
											></div>
											<span class="text-sm font-medium">{candidate.matchScore}</span>
										</div>
									{/if}
								</div>
								{#if candidate.reasoning}
									<p class="mt-2 line-clamp-2 text-xs text-muted-foreground">
										{candidate.reasoning}
									</p>
								{/if}
								<div class="mt-3 flex justify-between">
									<Button
										variant="outline"
										size="sm"
										href={candidate.linkedInProfile.url || '#'}
										target="_blank"
										class="text-xs"
									>
										View Profile
									</Button>
									<Button size="sm" class="text-xs">Contact</Button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="flex flex-1 flex-col overflow-hidden">
				<div class="flex items-center justify-between border-b border-border p-4">
					<div class="flex items-center gap-2">
						<MessageSquare class="h-5 w-5 text-primary" />
						<h2 class="text-lg font-medium">Chat - {job.chat?.title || 'New Chat'}</h2>
					</div>
					<Button variant="outline" size="sm" onclick={() => deleteChat()}>Delete Chat</Button>
				</div>

				<div class="flex-1 space-y-4 overflow-y-auto p-4">
					{#if job.description && job.description.length > 0}
						<div class="mb-4 rounded-lg border border-border bg-card/50 p-4">
							<div class="mb-2 flex items-center gap-2">
								<Briefcase class="h-4 w-4 text-primary" />
								<h4 class="font-medium">Job Description</h4>
							</div>
							<p class="text-sm text-muted-foreground">
								{#if job.description.length > 200 && !showFullDescription}
									{job.description.slice(0, 200)}...
									<button
										class="ml-1 text-sm font-medium text-primary hover:underline"
										onclick={() => (showFullDescription = true)}
									>
										Read more
									</button>
								{:else}
									{job.description}
									{#if showFullDescription && job.description.length > 200}
										<button
											class="ml-1 text-sm font-medium text-primary hover:underline"
											onclick={() => (showFullDescription = false)}
										>
											Show less
										</button>
									{/if}
								{/if}
							</p>
						</div>
					{/if}

					{#each messages as message (message.id)}
						<div
							class={`flex max-w-[85%] flex-col rounded-lg border border-border p-3 ${message.role === 'user' ? 'ml-auto bg-primary/10' : 'mr-auto bg-card'}`}
						>
							<div class="mb-1.5 flex items-center justify-between gap-2">
								<div class="flex items-center gap-2">
									<span class="text-xs font-medium">
										{message.role === 'user' ? 'You' : 'AI Assistant'}
									</span>
									{#if message.toolcalls && message.toolcalls.length > 0}
										<span class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
											Tool Calls:
											{#each message.toolcalls as toolcall (toolcall.args + toolcall.name + toolcall.result)}
												<p class="rounded-md bg-primary/20 p-1 text-xs">
													{toolcall.name}
												</p>
											{/each}
										</span>
									{/if}
								</div>
								<span class="text-xs text-muted-foreground">
									{new Date(message.createdAt).toLocaleTimeString([], {
										hour: '2-digit',
										minute: '2-digit'
									})}
								</span>
							</div>
							<Markdown md={message.content || ''} />
						</div>
					{/each}
				</div>

				{#if errorMessage}
					<div class="border-t border-border p-4">
						<p class="text-red-500">{errorMessage}</p>
					</div>
				{/if}
				<!-- Chat Input -->
				<div class="border-t border-border p-4">
					<div class="flex items-center gap-2">
						<div class="relative flex-1">
							<input
								bind:value={message}
								type="text"
								class="w-full rounded-md border border-border bg-background px-4 py-2 pr-10 text-sm"
								placeholder="Ask a question or type a command..."
								disabled={chatDisabled}
							/>
						</div>
						<Button onclick={() => sendMessage(message)} disabled={chatDisabled}>Send</Button>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex h-screen items-center justify-center">
			<Card class="w-full max-w-md">
				<CardContent class="flex items-center justify-center p-6">
					<p class="text-muted-foreground">
						Job not found or you do not have permission to view it.
					</p>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
