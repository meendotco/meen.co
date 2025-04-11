<script lang="ts">
	import { ArrowRight, Briefcase, Clock, Search, Users } from 'lucide-svelte';
	import { onMount } from 'svelte';

	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
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
		};
		reasoning?: string | null;
		matchScore?: number | null;
	}

	interface ChatHistory {
		timestamp: Date;
		content: string;
	}

	let { data } = $props();
	let job = $derived(data.job);
	let candidates = $derived<Candidate[]>((job?.candidates as Candidate[]) ?? []);
	let agentResponse = $state('');
	let assessmentHistory = $state<ChatHistory[]>([]);
	let isAssessing = $state(false);
	let showFullDescription = $state(false);

	async function assessCandidates() {
		if (!job?.id) {
			console.error('Job ID is missing');
			return;
		}

		isAssessing = true;
		agentResponse = '';

		try {
			const response = await fetch(`/api/jobs/${job.id}/assess`, {
				method: 'POST',
				body: JSON.stringify({
					jobId: job.id
				})
			});

			const result = await response.json();

			if (response.ok) {
				console.log('Candidates assessed:', result);

				// Save this assessment to history
				const newHistory: ChatHistory = {
					timestamp: new Date(),
					content: agentResponse
				};

				assessmentHistory = [...assessmentHistory, newHistory];

				// Save history to server
				await fetch(`/api/jobs/${job.id}/saveChat`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						chatHistory: assessmentHistory
					})
				});
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
		socket.on('chunk', (data) => {
			agentResponse += data.chunk;
		});
	});
</script>

<div class="container mx-auto space-y-8 py-6">
	{#if job}
		<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">{job.name}</h1>
				<p class="mt-2 text-muted-foreground">
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

		<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
			<Card class="md:col-span-2">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Users class="h-5 w-5 text-primary" />
						Candidates
					</CardTitle>
					<CardDescription>
						{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} for this position
					</CardDescription>
				</CardHeader>
				<CardContent>
					{#if candidates.length > 0}
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							{#each candidates as candidate (candidate.id)}
								<Card class="overflow-hidden border-border dark:bg-card/80">
									<CardHeader class="pb-3">
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
													<CardTitle class="text-base">
														{candidate.linkedInProfile.data?.first_name || 'N/A'}
														{candidate.linkedInProfile.data?.last_name || ''}
													</CardTitle>
													<CardDescription class="line-clamp-1">
														{candidate.linkedInProfile.data?.headline || 'No headline'}
													</CardDescription>
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
									</CardHeader>
									<CardContent class="pb-3 pt-0">
										{#if candidate.reasoning}
											<p class="line-clamp-3 text-sm text-muted-foreground">
												{candidate.reasoning}
											</p>
										{/if}
									</CardContent>
									<CardFooter class="flex justify-between border-t border-border/50 pt-3">
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
									</CardFooter>
								</Card>
							{/each}
						</div>
					{:else}
						<div
							class="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center"
						>
							<Users class="mb-3 h-10 w-10 text-muted-foreground" />
							<h3 class="text-lg font-medium">No candidates yet</h3>
							<p class="text-sm text-muted-foreground">
								Use the Assess button to find candidates for this job.
							</p>
						</div>
					{/if}
				</CardContent>
			</Card>

			<div class="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Briefcase class="h-5 w-5 text-primary" />
							Job Details
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-4">
							<div class="flex items-center gap-2">
								<Clock class="h-4 w-4 text-muted-foreground" />
								<span class="text-sm text-muted-foreground">
									Created on {formatDate(new Date(job.createdAt || new Date()))}
								</span>
							</div>
							<div class="rounded bg-primary/5 p-3">
								<h4 class="mb-1 font-medium">Match criteria:</h4>
								<p class="text-sm text-muted-foreground">
									AI uses this job description to find the best candidates
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Assessment History -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Clock class="h-5 w-5 text-primary" />
							Assessment History
						</CardTitle>
						<CardDescription>Previous candidate searches</CardDescription>
					</CardHeader>
					<CardContent>
						{#if assessmentHistory.length > 0}
							<div class="space-y-3">
								{#each assessmentHistory as history, i (i)}
									<div class="rounded-lg border border-border p-3">
										<div class="mb-1 flex items-center justify-between">
											<span class="text-xs font-medium">Assessment #{i + 1}</span>
											<span class="text-xs text-muted-foreground"
												>{formatDate(history.timestamp)}</span
											>
										</div>
										<p class="line-clamp-3 text-xs text-muted-foreground">
											{history.content.slice(0, 150)}...
										</p>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">No previous assessments</p>
						{/if}
					</CardContent>
				</Card>
			</div>
		</div>

		<!-- Display Live Agent Response -->
		{#if agentResponse}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Search class="h-5 w-5 text-primary" />
						Live Assessment Results
					</CardTitle>
					<CardDescription>Real-time output from the AI candidate assessment</CardDescription>
				</CardHeader>
				<CardContent>
					<pre
						class="whitespace-pre-wrap rounded-lg border border-border bg-muted/50 p-4 font-mono text-sm">{agentResponse}</pre>
				</CardContent>
				<CardFooter class="justify-between border-t border-border pt-4">
					<p class="text-xs text-muted-foreground">
						Assessment {isAssessing ? 'in progress' : 'completed'}
					</p>
					{#if !isAssessing && agentResponse}
						<Button variant="outline" size="sm" onclick={() => (agentResponse = '')}>
							Dismiss
						</Button>
					{/if}
				</CardFooter>
			</Card>
		{/if}
	{:else}
		<Card>
			<CardContent class="flex items-center justify-center p-6">
				<p class="text-muted-foreground">Job not found or you do not have permission to view it.</p>
			</CardContent>
		</Card>
	{/if}
</div>
