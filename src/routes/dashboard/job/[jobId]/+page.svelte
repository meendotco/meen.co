<script lang="ts">
	import type { TextStreamPart } from 'ai';
	import { Plus, Send } from 'lucide-svelte';
	import { onMount } from 'svelte';

	import { page } from '$app/state';
	import Avatar from '$lib/components/ui/avatar/avatar.svelte';
	import AvatarFallback from '$lib/components/ui/avatar/avatar-fallback.svelte';
	import AvatarImage from '$lib/components/ui/avatar/avatar-image.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Resizable from '$lib/components/ui/resizable';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import Markdown from '$lib/markdown/Markdown.svelte';
	import { socket } from '$lib/websocket/client.svelte.js';

	let errorMessage = $state<string | null>(null);
	let chatDisabled = $state(false);
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
	let message = $state('');
	let messages = $state<Message[]>((data.job?.chat?.messages as Message[] | undefined) ?? []);

	async function sendMessage(messageToSend: string) {
		if (!messageToSend.trim() || chatDisabled) return;

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
		await fetch(`/api/job/${job.id}/chat`, {
			method: 'POST',
			body: JSON.stringify({ message: messageToSend })
		});
		message = '';
	}

	function getScoreColor(score?: number | null) {
		if (score === undefined || score === null) return 'bg-gray-300 dark:bg-gray-700';
		if (score >= 80) return 'bg-green-500';
		if (score >= 60) return 'bg-yellow-500';
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

	// Handle keydown event for input
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey && message.trim() && !chatDisabled) {
			event.preventDefault();
			sendMessage(message);
		}
	}

	onMount(() => {
		socket.on(
			`${job.id}.messageChunk`,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(data: { chunk: TextStreamPart<any>; appPayload: { jobId: string; messageId: string } }) => {
				const chunk = data.chunk;
				console.log('messageChunk', data);

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
							? `${(chunk.error as Record<string, string>).name || 'Error'}: ${(chunk.error as Record<string, string>).reason || 'Unknown error'}`
							: 'An unknown error occurred';
				}
			}
		);

		socket.on(
			`${job.id}.messageStarted`,
			(data: { appPayload: { jobId: string; messageId: string } }) => {
				console.log('messageStarted', data);

				chatDisabled = true;
				errorMessage = null;

				messages.push({
					id: data.appPayload.messageId,
					content: '',
					role: 'assistant',
					createdAt: new Date(),
					chatId: job?.chat?.id ?? '',
					toolcalls: []
				} satisfies Message);
			}
		);

		socket.on(
			`${job.id}.messageComplete`,
			(data: { appPayload: { jobId: string; messageId: string } }) => {
				console.log('messageComplete', data);
				if (data.appPayload.jobId !== page.params.jobId) {
					return;
				}
				chatDisabled = false;
			}
		);
	});
</script>

<div class="flex h-screen flex-col overflow-hidden bg-background">
	{#if job}
		<Resizable.PaneGroup direction="horizontal" class="h-full">
			<Resizable.Pane defaultSize={75} class="p-4">
				<main class="space-y-6">
					<h1 class="text-3xl font-bold tracking-tight">{job.title}</h1>

					{#if job.description}
						<Card>
							<CardContent class="p-6">
								<h2 class="mb-4 text-xl font-semibold">Job Description</h2>
								<div class="prose prose-sm dark:prose-invert max-w-none">
									<Markdown md={job.description} />
								</div>
							</CardContent>
						</Card>
					{/if}

					<h2 class="text-2xl font-semibold">Candidates ({candidates.length})</h2>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{#each candidates as candidate (candidate.id)}
							<Card class="overflow-hidden">
								<CardContent class="flex items-start space-x-4 p-4">
									<Avatar class="h-12 w-12">
										{#if candidate.linkedInProfile.profileImageB64}
											<AvatarImage
												src={`data:image/jpeg;base64,${candidate.linkedInProfile.profileImageB64}`}
												alt={`${candidate.linkedInProfile.data.first_name ?? ''} ${candidate.linkedInProfile.data.last_name ?? ''}`}
											/>
										{:else if candidate.linkedInProfile.data.profile_pic_url}
											<AvatarImage
												src={candidate.linkedInProfile.data.profile_pic_url}
												alt={`${candidate.linkedInProfile.data.first_name ?? ''} ${candidate.linkedInProfile.data.last_name ?? ''}`}
											/>
										{/if}
										<AvatarFallback>
											{(candidate.linkedInProfile.data.first_name ?? '?').charAt(0).toUpperCase()}
											{(candidate.linkedInProfile.data.last_name ?? '?').charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div class="flex-1 space-y-1">
										<h3 class="text-lg font-medium">
											{#if candidate.linkedInProfile.url}
												<a
													href={candidate.linkedInProfile.url}
													target="_blank"
													rel="noopener noreferrer"
													class="hover:underline"
												>
													{candidate.linkedInProfile.data.first_name ?? ''}
													{candidate.linkedInProfile.data.last_name ?? ''}
												</a>
											{:else}
												{candidate.linkedInProfile.data.first_name ?? ''}
												{candidate.linkedInProfile.data.last_name ?? ''}
											{/if}
										</h3>
										<p class="text-sm text-muted-foreground">
											{candidate.linkedInProfile.data.headline}
										</p>
										{#if candidate.matchScore !== null && candidate.matchScore !== undefined}
											<Badge class="{getScoreColor(candidate.matchScore)} text-xs text-white">
												Match: {candidate.matchScore}/100
											</Badge>
										{/if}
									</div>
								</CardContent>
								{#if candidate.reasoning}
									<div class="border-t px-4 py-3">
										<p class="text-xs text-muted-foreground">{candidate.reasoning}</p>
									</div>
								{/if}
							</Card>
						{/each}
					</div>
					{#if candidates.length === 0}
						<p class="text-muted-foreground">No candidates found for this job yet.</p>
					{/if}
				</main>
			</Resizable.Pane>

			<Resizable.Handle withHandle />

			<Resizable.Pane defaultSize={25} minSize={20} maxSize={40}>
				<div class="flex h-full flex-col border-l bg-muted/40 p-4">
					<div class="mb-4 flex items-center justify-between">
						<h2 class=" text-xl font-semibold">Recruiter Agent Chat</h2>
						<Button class="flex items-center gap-2" variant="outline" size="icon">
							<Plus class="h-4 w-4" />
						</Button>
					</div>
					<ScrollArea class="flex-1">
						<div class="space-y-4 pr-4">
							{#each messages as msg (msg.id)}
								<div class:flex-row-reverse={msg.role === 'user'} class="flex items-end gap-2">
									<div
										class:bg-primary={msg.role === 'user'}
										class:text-primary-foreground={msg.role === 'user'}
										class:bg-card={msg.role === 'assistant'}
										class:text-card-foreground={msg.role === 'assistant'}
										class="max-w-[75%] rounded-lg p-3 shadow-sm"
									>
										<div class="prose prose-sm dark:prose-invert max-w-none">
											<Markdown md={msg.content} />
										</div>
										<p class="mt-1 text-right text-xs text-muted-foreground/80">
											{formatDate(msg.createdAt)}
										</p>
									</div>
								</div>
							{/each}
							{#if errorMessage}
								<div
									class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
								>
									{errorMessage}
								</div>
							{/if}
						</div>
					</ScrollArea>
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
