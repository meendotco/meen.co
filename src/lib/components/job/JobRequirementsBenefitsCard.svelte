<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';

	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import type { jobPost as jobPostTable } from '$lib/server/db/schema';

	type JobPostSelect = InferSelectModel<typeof jobPostTable>;

	let { job } = $props<{ job: JobPostSelect }>();
</script>

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
						{#each job.tech_stack.split(',') as tech (tech)}
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
