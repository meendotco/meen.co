<script lang="ts">
	import { onMount } from 'svelte';

	import { Button } from '$lib/components/ui/button';
	import { socket } from '$lib/websocket/client.svelte.js';
	// Define data structure interfaces
	interface LinkedInProfileData {
		first_name?: string;
		last_name?: string;
		headline?: string;
	}

	interface Candidate {
		id: string; // Assuming ID is a string, adjust if needed
		linkedInProfile: {
			data: LinkedInProfileData; // Assume data exists and has this shape
		};
		reasoning?: string | null; // Add reasoning
		matchScore?: number | null; // Add matchScore
		// Add other candidate properties if known
	}

	let { data } = $props();
	let job = $derived(data.job);
	// Explicitly type the derived state and assert the input type
	let candidates = $derived<Candidate[]>((job?.candidates as Candidate[]) ?? []);
	let agentResponse = $state(''); // State for agent's streaming response

	async function assesCandidates() {
		if (!job?.id) {
			console.error('Job ID is missing');
			return; // Exit if job or job.id is undefined
		}
		const response = await fetch(`/api/jobs/${job.id}/assess`, {
			method: 'POST',
			body: JSON.stringify({
				jobId: job.id
			})
		});
		agentResponse = ''; // Clear previous response on new assessment
		const assessmentResult = await response.json(); // Renamed from 'data'
		if (response.ok) {
			// TODO: Update state based on assessmentResult, perhaps by invalidating load function
			console.log('Candidates assessed:', assessmentResult);
		} else {
			console.error(assessmentResult);
		}
	}

	onMount(() => {
		socket.on('chunk', (data) => {
			console.log(data);
			agentResponse += data.chunk;
		});
	});
</script>

<div class="space-y-6 p-4 md:p-6">
	{#if job}
		<div>
			<h1 class="text-2xl font-bold lg:text-3xl">{job.name}</h1>
			<p class="mt-1 text-gray-600">{job.description}</p>
		</div>
		<div>
			<Button onclick={assesCandidates}>Assess Candidates</Button>
		</div>

		<!-- Display Agent Response -->
		{#if agentResponse}
			<div class="mt-4 rounded border bg-gray-50 p-4 shadow-sm">
				<h2 class="mb-2 text-lg font-semibold">Agent Assessment</h2>
				<pre
					class="whitespace-pre-wrap rounded border bg-white p-2 font-mono text-sm">{agentResponse}</pre>
			</div>
		{/if}

		<div class="mt-6">
			<h2 class="mb-4 text-xl font-semibold">Candidates</h2>
			{#if candidates.length > 0}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each candidates as candidate (candidate.id)}
						<div class="rounded border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
							<h3 class="truncate text-lg font-medium">
								{candidate.linkedInProfile.data?.first_name ?? 'N/A'}
								{candidate.linkedInProfile.data?.last_name}
							</h3>
							<p class="mb-2 truncate text-sm text-gray-500">
								{candidate.linkedInProfile.data?.headline ?? 'No headline'}
							</p>
							<div class="space-y-1 text-sm">
								{#if candidate.matchScore !== null && candidate.matchScore !== undefined}
									<p>
										<span class="font-medium">Match Score:</span>
										<span class="font-semibold text-blue-600">{candidate.matchScore}</span>
									</p>
								{/if}
								{#if candidate.reasoning}
									<p>
										<span class="font-medium">Reasoning:</span>
										<span class="text-gray-700">{candidate.reasoning}</span>
									</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="italic text-gray-500">No candidates found for this job yet.</p>
			{/if}
		</div>
	{:else}
		<p class="text-red-500">Job not found or you do not have permission to view it.</p>
	{/if}
</div>
