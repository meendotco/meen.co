<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';
	import { Building, MapPin } from 'lucide-svelte';

	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import type { jobPost as jobPostTable } from '$lib/server/db/schema';

	type JobPostSelect = InferSelectModel<typeof jobPostTable>;

	let { job } = $props<{ job: JobPostSelect }>();
</script>

<Card>
	<CardHeader class="p-3 pb-2 sm:p-4 sm:pb-2">
		<CardTitle class="text-sm sm:text-base">Job Overview</CardTitle>
	</CardHeader>
	<CardContent class="p-3 pt-0 sm:p-4 sm:pt-0">
		<div class="space-y-3">
			{#if job.department}
				<div class="flex items-start gap-3">
					<Building class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
					<div>
						<p class="text-xs font-medium sm:text-sm">Department</p>
						<p class="text-xs text-muted-foreground sm:text-sm">{job.department}</p>
					</div>
				</div>
			{/if}
			{#if job.location}
				<div class="flex items-start gap-3">
					<MapPin class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
					<div>
						<p class="text-xs font-medium sm:text-sm">Location</p>
						<p class="text-xs text-muted-foreground sm:text-sm">{job.location}</p>
					</div>
				</div>
			{/if}
			{#if job.type}
				<div class="flex items-start gap-3">
					<svg
						class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path
							d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
						></path></svg
					>
					<div>
						<p class="text-xs font-medium sm:text-sm">Type</p>
						<p class="text-xs text-muted-foreground sm:text-sm">{job.type}</p>
					</div>
				</div>
			{/if}
			{#if job.salary}
				<div class="flex items-start gap-3">
					<svg
						class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><circle cx="12" cy="12" r="10"></circle><path
							d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"
						></path><path d="M12 18V6"></path></svg
					>
					<div>
						<p class="text-xs font-medium sm:text-sm">Salary Range</p>
						<p class="text-xs text-muted-foreground sm:text-sm">{job.salary}</p>
					</div>
				</div>
			{/if}
		</div>
	</CardContent>
</Card>
