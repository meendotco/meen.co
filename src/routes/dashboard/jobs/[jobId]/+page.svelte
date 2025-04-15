<script lang="ts">
	import { ArrowRight, Briefcase, Clock, MessageSquare, Search, Users } from 'lucide-svelte';
	import { onMount } from 'svelte';

	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import Markdown from '$lib/markdown/Markdown.svelte';
	import { socket } from '$lib/websocket/client.svelte.js';
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
	}

	let { data } = $props();
	let job = $derived(data.job);
	let candidates = $derived<Candidate[]>((job?.candidates as Candidate[]) ?? []);
	let agentResponse = $state('');
	let isAssessing = $state(false);
	let showFullDescription = $state(false);
	let message = $state('');
	async function sendMessage(message: string) {
		if (!job?.id) {
			console.error('Job ID is missing');
			return;
		}

		const response = await fetch(`/api/jobs/${job.id}/chat`, {
			method: 'POST',
			body: JSON.stringify({ message })
		});
		const data = await response.json();
		console.log(data);
	}

	async function assessCandidates() {
		if (!job?.id) {
			console.error('Job ID is missing');
			return;
		}

		isAssessing = true;
		agentResponse = '';

		try {
			const response = await fetch(`/api/jobs/${job.id}/chat`, {
				method: 'POST',
				body: JSON.stringify({
					message: 'Assess the candidates'
				})
			});

			const result = await response.json();

			if (response.ok) {
				console.log('Candidates assessed:', result);
			} else {
				console.error(result);
			}
		} finally {
			isAssessing = false;
		}
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
		socket.on('messageChunk', (data) => {
			if (data.chunk.type === 'text-delta') {
				agentResponse += data.chunk.textDelta;
			}
			if (data.chunk.type === 'tool-result') {
				agentResponse += `\n\nI used the tool: ${data.chunk.result.toolName}`;
				console.log('Received tool result:', data.chunk.result);
			}
		});
	});

	async function deleteChat() {
		if (!job?.id) {
			console.error('Job ID is missing');
			return;
		}

		const response = await fetch(`/api/jobs/${job.id}/chat/delete`, {
			method: 'POST'
		});
		const data = await response.json();
		console.log(data);
	}
</script>

<div class="flex h-screen flex-col">
	{#if job}
		<!-- Top Bar with Job Details -->
		<div class="border-b border-border bg-card p-4">
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div class="flex items-center gap-4">
					<div>
						<h1 class="text-2xl font-bold tracking-tight">{job.title}</h1>
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

				<div class="flex gap-2">
					<Button variant="outline" href="/dashboard/jobs" class="gap-2">
						<ArrowRight class="h-4 w-4 rotate-180" />
						All Jobs
					</Button>
					<Button onclick={assessCandidates} disabled={isAssessing} class="gap-2">
						<Search class="h-4 w-4" />
						{isAssessing ? 'Assessing...' : 'Assess Candidates'}
					</Button>
				</div>
			</div>
		</div>

		<!-- Main Content Area -->
		<div class="flex flex-1 overflow-hidden">
			<!-- Candidates Section -->
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
										href={candidate.linkedInProfile.url}
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
				{:else}
					<div class="flex flex-col items-center justify-center p-8 text-center">
						<Users class="mb-3 h-10 w-10 text-muted-foreground" />
						<h3 class="text-lg font-medium">No candidates yet</h3>
						<p class="text-sm text-muted-foreground">
							Use the Assess button to find candidates for this job.
						</p>
					</div>
				{/if}
			</div>

			<!-- Chat Section -->
			<div class="flex flex-1 flex-col overflow-hidden">
				<!-- Chat Header -->
				<div class="flex items-center justify-between border-b border-border p-4">
					<div class="flex items-center gap-2">
						<MessageSquare class="h-5 w-5 text-primary" />
						<h2 class="text-lg font-medium">Chat - {job.chat?.title || 'New Chat'}</h2>
					</div>
					<Button variant="outline" size="sm" onclick={() => deleteChat()}>Delete Chat</Button>
				</div>

				<!-- Chat Messages -->
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

					{#each job.chat?.messages || [] as message (message.id)}
						<div class="rounded-lg border border-border p-4">
							{#if message.toolcalls}
								<Markdown md={message.content || ''} />
							{:else}
								<p class="text-sm">{message.content}</p>
							{/if}
						</div>
					{/each}

					<!-- Live Assessment Results -->
					{#if agentResponse}
						<div class="rounded-lg border border-primary/20 bg-primary/5 p-4">
							<div class="mb-2 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Search class="h-4 w-4 text-primary" />
									<span class="font-medium text-primary">Assessment Results</span>
								</div>
								<span class="text-xs text-muted-foreground">
									{isAssessing ? 'In progress...' : 'Completed'}
								</span>
							</div>
							<pre class="whitespace-pre-wrap font-mono text-sm">{agentResponse}</pre>
							{#if !isAssessing}
								<div class="mt-3 flex justify-end">
									<Button variant="outline" size="sm" onclick={() => (agentResponse = '')}>
										Dismiss
									</Button>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Chat Input -->
				<div class="border-t border-border p-4">
					<div class="flex items-center gap-2">
						<div class="relative flex-1">
							<input
								bind:value={message}
								type="text"
								class="w-full rounded-md border border-border bg-background px-4 py-2 pr-10 text-sm"
								placeholder="Ask a question or type a command..."
								disabled={isAssessing}
							/>
						</div>
						<Button onclick={() => sendMessage(message)} disabled={isAssessing}>Send</Button>
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
