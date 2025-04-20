<script lang="ts">
	import type { TextStreamPart } from 'ai';
	import { formatDistanceToNow } from 'date-fns';
	import type { InferSelectModel } from 'drizzle-orm';
	import { ArrowLeft, Building, MapPin, Send, Trash2 } from 'lucide-svelte';
	import { onMount } from 'svelte';

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
	type ChatSelect = InferSelectModel<typeof chatTable> & {
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
	<!-- Header with job title and back button -->
	<header class="border-b bg-card/30 px-3 py-2 sm:px-6 sm:py-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2 sm:gap-3">
				<Button
					variant="ghost"
					size="icon"
					onclick={() => history.back()}
					class="h-7 w-7 sm:h-8 sm:w-8"
				>
					<ArrowLeft class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
				</Button>
				<h1 class="text-base font-medium sm:text-lg">{job?.title || 'Job Details'}</h1>
				{#if job?.priority}
					<Badge variant="outline" class="hidden sm:inline-flex">{job.priority}</Badge>
				{/if}
			</div>
			<div>
				<Badge variant="secondary" class="text-xs">Posted {jobCreatedAtFormatted}</Badge>
			</div>
		</div>
	</header>

	{#if job}
		<Resizable.PaneGroup direction="horizontal" class="h-full">
			<Resizable.Pane defaultSize={75} class="flex h-full flex-col">
				<div class="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4">
					<div class="space-y-4 sm:space-y-6">
						<!-- Job Overview -->
						<div class="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
							<Card>
								<CardHeader class="p-3 pb-2 sm:p-4 sm:pb-2">
									<CardTitle class="text-sm sm:text-base">Job Overview</CardTitle>
								</CardHeader>
								<CardContent class="p-3 pt-0 sm:p-4 sm:pt-0">
									<div class="space-y-3">
										{#if job.department}
											<div class="flex items-start gap-3">
												<Building class="mt-0.5 h-4 w-4 text-muted-foreground" />
												<div>
													<p class="text-xs font-medium sm:text-sm">Department</p>
													<p class="text-xs text-muted-foreground sm:text-sm">{job.department}</p>
												</div>
											</div>
										{/if}
										{#if job.location}
											<div class="flex items-start gap-3">
												<MapPin class="mt-0.5 h-4 w-4 text-muted-foreground" />
												<div>
													<p class="text-xs font-medium sm:text-sm">Location</p>
													<p class="text-xs text-muted-foreground sm:text-sm">{job.location}</p>
												</div>
											</div>
										{/if}
										{#if job.type}
											<div class="flex items-start gap-3">
												<svg
													class="mt-0.5 h-4 w-4 text-muted-foreground"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
													><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path
														d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
													></path></svg
												>
												<div>
													<p class="text-xs font-medium sm:text-sm">Type</p>
													<p class="text-xs text-muted-foreground sm:text-sm">{job.type}</p>
												</div>
											</div>
										{/if}
										{#if job.salary}
											<div class="flex items-start gap-3">
												<svg
													class="mt-0.5 h-4 w-4 text-muted-foreground"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
													><circle cx="12" cy="12" r="10"></circle><path
														d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"
													></path><path d="M12 18V6"></path></svg
												>
												<div>
													<p class="text-xs font-medium sm:text-sm">Salary Range</p>
													<p class="text-xs text-muted-foreground sm:text-sm">{job.salary}</p>
												</div>
											</div>
										{/if}
									</div>
								</CardContent>
							</Card>

							{#if job.tech_stack || job.remote_policy}
								<Card>
									<CardHeader class="p-3 pb-2 sm:p-4 sm:pb-2">
										<CardTitle class="text-sm sm:text-base">Requirements & Benefits</CardTitle>
									</CardHeader>
									<CardContent class="p-3 pt-0 sm:p-4 sm:pt-0">
										<div class="space-y-3">
											{#if job.tech_stack}
												<div>
													<p class="mb-1 text-xs font-medium sm:text-sm">Tech Stack</p>
													<div class="flex flex-wrap gap-1">
														{#each job.tech_stack.split(',') as tech}
															<Badge variant="outline" class="bg-muted/50 text-xs font-normal">
																{tech.trim()}
															</Badge>
														{/each}
													</div>
												</div>
											{/if}
											{#if job.remote_policy}
												<div>
													<p class="mb-1 text-xs font-medium sm:text-sm">Remote Policy</p>
													<p class="text-xs text-muted-foreground sm:text-sm">
														{job.remote_policy}
													</p>
												</div>
											{/if}
										</div>
									</CardContent>
								</Card>
							{/if}
						</div>

						<!-- Job Description -->
						{#if job.description}
							<Card>
								<CardHeader class="p-3 pb-2 sm:p-4 sm:pb-2">
									<CardTitle class="text-sm sm:text-base">Job Description</CardTitle>
								</CardHeader>
								<CardContent class="p-3 pt-0 sm:p-4 sm:pt-0">
									<div class="prose prose-xs dark:prose-invert max-w-none text-sm leading-relaxed">
										<Markdown md={job.description} />
									</div>
								</CardContent>
							</Card>
						{/if}

						<!-- Combined Details Card -->
						{#if job.responsibilities || job.requirements || job.benefits}
							<Card>
								<CardHeader class="p-3 pb-2 sm:p-4 sm:pb-2">
									<CardTitle class="text-sm sm:text-base">Job Details</CardTitle>
								</CardHeader>
								<CardContent class="p-3 pt-0 sm:p-4 sm:pt-0">
									<div class="space-y-6">
										{#if job.responsibilities}
											<div>
												<h3 class="mb-2 text-xs font-medium sm:text-sm">Responsibilities</h3>
												<div
													class="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed"
												>
													<Markdown md={job.responsibilities} />
												</div>
											</div>
										{/if}

										{#if job.requirements}
											<div>
												<h3 class="mb-2 text-xs font-medium sm:text-sm">Requirements</h3>
												<div
													class="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed"
												>
													<Markdown md={job.requirements} />
												</div>
											</div>
										{/if}

										{#if job.benefits}
											<div>
												<h3 class="mb-2 text-xs font-medium sm:text-sm">Benefits</h3>
												<div
													class="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed"
												>
													<Markdown md={job.benefits} />
												</div>
											</div>
										{/if}
									</div>
								</CardContent>
							</Card>
						{/if}

						<!-- Candidates Section -->
						<div>
							<h2 class="mb-2 text-base font-medium sm:mb-4 sm:text-lg">
								Candidates ({candidates.length})
							</h2>
							{#if candidates.length > 0}
								<div class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
									{#each candidates as candidate (candidate.id)}
										<CandidateCard {candidate} jobId={job.id} />
									{/each}
								</div>
							{:else}
								<div
									class="flex h-24 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 sm:h-32"
								>
									<p class="text-center text-sm text-muted-foreground">
										No candidates found for this job yet.
									</p>
									<p class="mt-1 text-center text-xs text-muted-foreground">
										Use the chat to find candidates.
									</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</Resizable.Pane>

			<Resizable.Handle withHandle />

			<Resizable.Pane defaultSize={30} minSize={20} maxSize={35} class="flex h-full flex-col">
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
									><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
									></path></svg
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
			</Resizable.Pane>
		</Resizable.PaneGroup>
	{:else}
		<div class="flex h-screen items-center justify-center bg-background">
			<Card class="w-full max-w-md shadow-lg">
				<CardContent class="flex items-center justify-center p-6 sm:p-8">
					<p class="text-muted-foreground">
						Job not found or you do not have permission to view it.
					</p>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
