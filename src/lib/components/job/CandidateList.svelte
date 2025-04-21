<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';
	import { onMount } from 'svelte';

	import CandidateCard from '$lib/components/CandidateCard.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import type {
		candidates as candidatesTable,
		linkedInProfile as linkedInProfileTable
	} from '$lib/server/db/schema';
	import { socket } from '$lib/websocket/client.svelte';

	type LinkedInProfileSelect = InferSelectModel<typeof linkedInProfileTable>;
	type CandidateSelect = InferSelectModel<typeof candidatesTable> & {
		linkedInProfile: LinkedInProfileSelect | null;
		isNew?: boolean;
	};

	let { candidates: initialCandidates, jobId } = $props<{
		candidates: CandidateSelect[];
		jobId: string;
	}>();

	let candidateList = $state<CandidateSelect[]>(
		initialCandidates.map((c: CandidateSelect) => ({ ...c, isNew: false }))
	);

	onMount(() => {
		socket.on(`${jobId}:candidate-added`, (candidate: CandidateSelect) => {
			console.log('candidate-added', candidate);
			if (!candidateList.some((c) => c.id === candidate.id)) {
				candidateList.unshift({ ...candidate, isNew: true });
			}
		});
	});
</script>

<div>
	<h2 class="mb-2 text-base font-medium sm:mb-4 sm:text-lg">
		Candidates ({candidateList.length})
	</h2>
	{#if candidateList.length > 0}
		<div class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each candidateList as candidate (candidate.id)}
				<div class="relative">
					<CandidateCard {candidate} {jobId} />
					{#if candidate.isNew}
						<Badge
							variant="outline"
							class="absolute right-2 top-2 border-green-500 bg-background/80 px-1.5 py-0.5 text-xs text-green-500 backdrop-blur-sm"
							>New</Badge
						>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div
			class="flex h-24 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 sm:h-32"
		>
			<p class="text-center text-sm text-muted-foreground">No candidates found for this job yet.</p>
			<p class="mt-1 text-center text-xs text-muted-foreground">Use the chat to find candidates.</p>
		</div>
	{/if}
</div>
