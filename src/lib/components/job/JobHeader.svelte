<script lang="ts">
	import { formatDistanceToNow } from 'date-fns';
	import type { InferSelectModel } from 'drizzle-orm';
	import { ArrowLeft } from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { jobPost as jobPostTable } from '$lib/server/db/schema';

	type JobPostSelect = InferSelectModel<typeof jobPostTable>;

	let { job } = $props<{ job: JobPostSelect | null }>();

	let jobCreatedAtFormatted = $derived(
		job?.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : ''
	);
</script>

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
			<h1 class="truncate text-base font-medium sm:text-lg">{job?.title || 'Job Details'}</h1>
			{#if job?.priority}
				<Badge variant="outline" class="hidden shrink-0 sm:inline-flex">{job.priority}</Badge>
			{/if}
		</div>
		<div>
			{#if jobCreatedAtFormatted}
				<Badge variant="secondary" class="shrink-0 text-xs">Posted {jobCreatedAtFormatted}</Badge>
			{/if}
		</div>
	</div>
</header>
