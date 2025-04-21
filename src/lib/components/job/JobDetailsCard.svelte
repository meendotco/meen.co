<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';

	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import Markdown from '$lib/markdown/Markdown.svelte';
	import type { jobPost as jobPostTable } from '$lib/server/db/schema';

	type JobPostSelect = InferSelectModel<typeof jobPostTable>;

	let { job } = $props<{ job: JobPostSelect }>();
</script>

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
						<div class="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed">
							<Markdown md={job.responsibilities} />
						</div>
					</div>
				{/if}

				{#if job.requirements}
					<div>
						<h3 class="mb-2 text-xs font-medium sm:text-sm">Requirements</h3>
						<div class="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed">
							<Markdown md={job.requirements} />
						</div>
					</div>
				{/if}

				{#if job.benefits}
					<div>
						<h3 class="mb-2 text-xs font-medium sm:text-sm">Benefits</h3>
						<div class="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed">
							<Markdown md={job.benefits} />
						</div>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>
{/if}
