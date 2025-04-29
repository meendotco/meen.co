<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';

	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Pencil, X, Check } from 'lucide-svelte';
	import Markdown from '$lib/markdown/Markdown.svelte';
	import type { jobPost as jobPostTable } from '$lib/server/db/schema';
	import { toast } from 'svelte-sonner';

	type JobPostSelect = InferSelectModel<typeof jobPostTable>;

	let { job } = $props<{ job: JobPostSelect }>();
	let isEditing = $state(false);
	let isSending = $state(false);
	let editedResponsibilities = $state(job.responsibilities ?? '');
	let editedRequirements = $state(job.requirements ?? '');
	let editedBenefits = $state(job.benefits ?? '');

	function handleEdit() {
		isEditing = true;
	}

	async function handleSave() {
		isSending = true;
		try {
			const loadingToast = toast.loading('Updating job details...', {
				duration: Infinity
			});
			const response = await fetch(`/api/job/${job?.id}/edit`, {
				method: 'PATCH',
				body: JSON.stringify({
					responsibilities: editedResponsibilities,
					requirements: editedRequirements,
					benefits: editedBenefits
				})
			});

			toast.dismiss(loadingToast);

			job = {
				...job,
				responsibilities: editedResponsibilities,
				requirements: editedRequirements,
				benefits: editedBenefits
			};

			if (!response.ok) {
				throw new Error('Failed to update job details');
			}
			toast.success('Job details updated successfully');
		} catch (error) {
			console.error('Error updating job details:', error);
			toast.error('Error updating job details');
		}
		isEditing = false;
		isSending = false;
	}

	function handleCancel() {
		editedResponsibilities = job.responsibilities;
		editedRequirements = job.requirements;
		editedBenefits = job.benefits;
		isEditing = false;
	}
</script>

{#if job.responsibilities || job.requirements || job.benefits}
	<Card>
		<CardHeader class="flex flex-row items-center justify-between p-3 pb-2 sm:p-4 sm:pb-2">
			<CardTitle class="text-sm sm:text-base">Job Details</CardTitle>
			<div class="flex gap-2">
				{#if isEditing}
					<Button
						variant="outline"
						size="sm"
						onclick={handleCancel}
						disabled={isSending}
						title="Cancel"
					>
						Cancel
					</Button>
					<Button size="sm" onclick={handleSave} disabled={isSending} title="Save">
						{isSending ? 'Saving...' : 'Save'}
					</Button>
				{:else}
					<Button variant="link" size="icon" onclick={handleEdit} title="Edit">
						<Pencil class="h-4 w-4" />
					</Button>
				{/if}
			</div>
		</CardHeader>
		<CardContent class="p-3 pt-0 sm:p-4 sm:pt-0">
			<div class="space-y-6">
				{#if job.responsibilities || isEditing}
					<div>
						<h3 class="mb-2 text-xs font-medium sm:text-sm">Responsibilities</h3>
						{#if isEditing}
							<textarea
								bind:value={editedResponsibilities}
								class="min-h-[100px] w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none"
								placeholder="Enter responsibilities..."
								maxLength={1000}
							/>
						{:else}
							<div class="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed">
								<Markdown md={job.responsibilities} />
							</div>
						{/if}
					</div>
				{/if}

				{#if job.requirements || isEditing}
					<div>
						<h3 class="mb-2 text-xs font-medium sm:text-sm">Requirements</h3>
						{#if isEditing}
							<textarea
								bind:value={editedRequirements}
								class="min-h-[100px] w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none"
								placeholder="Enter requirements..."
								maxLength={1000}
							/>
						{:else}
							<div class="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed">
								<Markdown md={job.requirements} />
							</div>
						{/if}
					</div>
				{/if}

				{#if job.benefits || isEditing}
					<div>
						<h3 class="mb-2 text-xs font-medium sm:text-sm">Benefits</h3>
						{#if isEditing}
							<textarea
								bind:value={editedBenefits}
								class="min-h-[100px] w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none"
								placeholder="Enter benefits..."
								maxLength={1000}
							/>
						{:else}
							<div class="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed">
								<Markdown md={job.benefits} />
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>
{/if}
