<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';

	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import Markdown from '$lib/markdown/Markdown.svelte';
	import type { jobPost as jobPostTable } from '$lib/server/db/schema';

	type JobPostSelect = InferSelectModel<typeof jobPostTable>;

	let { job } = $props<{ job: JobPostSelect }>();
</script>

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
