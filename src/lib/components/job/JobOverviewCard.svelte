<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';
	import { Building, MapPin, Briefcase, Pencil, DollarSign } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select';
	import type { jobPost as jobPostTable } from '$lib/server/db/schema';
	import type { Selected } from 'bits-ui';
	import { toast } from 'svelte-sonner';

	type JobPostSelect = InferSelectModel<typeof jobPostTable>;

	let { job } = $props<{ job: JobPostSelect }>();
	let isEditing = $state(false);
	let isSending = $state(false);
	let editedJob = $state({ ...job });

	const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'] as const;

	async function handleSave() {
		isSending = true;
		try {
			const loadingToast = toast.loading('Updating job details...', {
				duration: Infinity
			});
			const response = await fetch(`/api/job/${job?.id}/edit`, {
				method: 'PATCH',
				body: JSON.stringify({
					department: editedJob.department,
					location: editedJob.location,
					type: editedJob.type,
					salary: editedJob.salary
				})
			});
			toast.dismiss(loadingToast);
			if (!response.ok) throw new Error('Failed to update job details');
			toast.success('Job details updated successfully');
			job = editedJob;
		} catch (error) {
			console.error('Error updating job details:', error);
		}
		isSending = false;
		isEditing = false;
	}

	function handleCancel() {
		editedJob = { ...job };
		isEditing = false;
	}
</script>

<Card>
	<CardHeader class="p-3 pb-2 sm:p-4 sm:pb-2">
		<div class="flex items-center justify-between">
			<CardTitle class="text-sm sm:text-base">Job Overview</CardTitle>
			<div class="flex gap-2">
				{#if isEditing}
					<Button
						variant="outline"
						size="sm"
						onclick={handleCancel}
						disabled={isSending}
						title="Cancel">Cancel</Button
					>
					<Button size="sm" onclick={handleSave} disabled={isSending} title="Save">
						{isSending ? 'Saving...' : 'Save'}
					</Button>
				{:else}
					<Button variant="link" size="icon" onclick={() => (isEditing = true)}>
						<Pencil class="h-4 w-4" />
					</Button>
				{/if}
			</div>
		</div>
	</CardHeader>
	<CardContent class="p-3 pt-0 sm:p-4 sm:pt-0">
		<div class="space-y-3">
			{#if job.department || isEditing}
				<div class="flex items-start gap-3">
					<Building class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
					<div class="flex-1">
						<p class="pb-1 text-xs font-medium sm:text-sm">Department</p>
						{#if isEditing}
							<Input
								bind:value={editedJob.department}
								class="h-8 text-xs focus-visible:ring-transparent sm:text-sm"
								placeholder="Enter department"
							/>
						{:else}
							<p class="text-xs text-muted-foreground sm:text-sm">{job.department}</p>
						{/if}
					</div>
				</div>
			{/if}
			{#if job.location || isEditing}
				<div class="flex items-start gap-3">
					<MapPin class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
					<div class="flex-1">
						<p class="pb-1 text-xs font-medium sm:text-sm">Location</p>
						{#if isEditing}
							<Input
								bind:value={editedJob.location}
								class="h-8 text-xs focus-visible:ring-transparent sm:text-sm"
								placeholder="Enter location"
							/>
						{:else}
							<p class="text-xs text-muted-foreground sm:text-sm">{job.location}</p>
						{/if}
					</div>
				</div>
			{/if}
			{#if job.type || isEditing}
				<div class="flex items-start gap-3">
					<Briefcase class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
					<div class="flex-1">
						<p class="pb-1 text-xs font-medium sm:text-sm">Type</p>
						{#if isEditing}
							<Select
								selected={editedJob.type}
								onSelectedChange={(e: Selected<string> | undefined) => (editedJob.type = e?.value)}
							>
								<SelectTrigger class="h-8 text-xs sm:text-sm">
									{editedJob.type.charAt(0).toUpperCase() + editedJob.type.slice(1) ||
										'Select job type'}
								</SelectTrigger>
								<SelectContent>
									{#each jobTypes as type}
										<SelectItem value={type}>{type}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						{:else}
							<p class="text-xs text-muted-foreground sm:text-sm">{job.type}</p>
						{/if}
					</div>
				</div>
			{/if}
			{#if job.salary || isEditing}
				<div class="flex items-start gap-3">
					<DollarSign class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
					<div class="flex-1">
						<p class="pb-1 text-xs font-medium sm:text-sm">Salary Range</p>
						{#if isEditing}
							<Input
								bind:value={editedJob.salary}
								class="h-8 text-xs focus-visible:ring-transparent sm:text-sm "
								placeholder="Enter salary range"
							/>
						{:else}
							<p class="text-xs text-muted-foreground sm:text-sm">{job.salary}</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</CardContent>
</Card>
