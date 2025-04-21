<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';

	import CandidateCard from '$lib/components/CandidateCard.svelte';
	import type {
		candidates as candidatesTable,
		linkedInProfile as linkedInProfileTable
	} from '$lib/server/db/schema';

	type LinkedInProfileSelect = InferSelectModel<typeof linkedInProfileTable>;
	type CandidateSelect = InferSelectModel<typeof candidatesTable> & {
		linkedInProfile: LinkedInProfileSelect | null;
	};

	let { candidates, jobId } = $props<{ candidates: CandidateSelect[]; jobId: string }>();
</script>

<div>
	<h2 class="mb-2 text-base font-medium sm:mb-4 sm:text-lg">
		Candidates ({candidates.length})
	</h2>
	{#if candidates.length > 0}
		<div class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each candidates as candidate (candidate.id)}
				<CandidateCard {candidate} {jobId} />
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
