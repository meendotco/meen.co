<script lang="ts">
	import { formatDistanceToNow } from 'date-fns';
	import type { InferSelectModel } from 'drizzle-orm';
	import { ArrowLeft } from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import type { jobPost as jobPostTable } from '$lib/server/db/schema';
	import type { Selected } from 'bits-ui';
	type JobPostSelect = InferSelectModel<typeof jobPostTable>;

	let { job } = $props<{ job: JobPostSelect | null }>();

	let jobCreatedAtFormatted = $derived(
		job?.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : ''
	);

	let jobStatus = $state(job?.status || 'Active');

	const statusItems = [
		{ value: 'Active', label: 'Active' },
		{ value: 'Closed', label: 'Closed' }
	];

	async function handleStatusChange(e: Selected<string> | undefined) {
		jobStatus = e.value as string;
		try {
			await fetch(`/api/job/${job?.id}/edit`, {
				method: 'PATCH',
				body: JSON.stringify({ status: jobStatus })
			});
		} catch (error) {
			console.error('Error updating job status:', error);
		}
	}
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
			<Separator orientation="vertical" class="h-4" />
			<div>
				<Select
					selected={jobStatus}
					onSelectedChange={(e: Selected<string> | undefined) => handleStatusChange(e)}
				>
					<SelectTrigger class="rounded-full">
						<div class="flex items-center gap-2">
							<div
								class="h-2 w-2 rounded-full {jobStatus === 'Active'
									? 'bg-green-500'
									: 'bg-red-500'}"
							></div>
							{jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1) || 'Select status'}
						</div>
					</SelectTrigger>
					<SelectContent>
						{#each statusItems as { value, label } (value)}
							<SelectItem {value}>
								{label}
							</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>
		</div>
		<div>
			{#if jobCreatedAtFormatted}
				<Badge variant="secondary" class="shrink-0 text-xs">Posted {jobCreatedAtFormatted}</Badge>
			{/if}
		</div>
	</div>
</header>
