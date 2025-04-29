<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';

	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Pencil, X, Check } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import Markdown from '$lib/markdown/Markdown.svelte';
	import type { jobPost as jobPostTable } from '$lib/server/db/schema';

	type JobPostSelect = InferSelectModel<typeof jobPostTable>;

	let { job } = $props<{ job: JobPostSelect }>();
	let isEditing = $state(false);
	let editedDescription = $state(job.description);

	function handleEdit() {
		isEditing = true;
	}

	async function handleSave() {
		try {
			const loadingToast = toast.loading('Saving job description...', {
				duration: Infinity
			});
			const response = await fetch(`/api/job/${job.id}/description`, {
				method: 'PATCH',
				body: JSON.stringify({ description: editedDescription })
			});
			if (!response.ok) {
				toast.error('Failed to save job description');
				return;
			}
			toast.dismiss(loadingToast);
			toast.success('Job description saved successfully');
		} catch (error) {
			toast.error('Failed to save job description');
		}
		job.description = editedDescription;
		isEditing = false;
	}
	function handleCancel() {
		editedDescription = job.description;
		isEditing = false;
	}
</script>

{#if job.description}
	<Card>
		<CardHeader class="flex flex-row items-center justify-between p-3 pb-2 sm:p-4 sm:pb-2">
			<CardTitle class="text-sm sm:text-base">Job Description</CardTitle>
			<div class="flex gap-2">
				{#if isEditing}
					<Button variant="outline" size="sm" onclick={handleCancel} title="Cancel">Cancel</Button>
					<Button size="sm" onclick={handleSave} title="Save">Save</Button>
				{:else}
					<Button variant="link" size="icon" onclick={handleEdit} title="Edit">
						<Pencil class="h-4 w-4" />
					</Button>
				{/if}
			</div>
		</CardHeader>
		<CardContent class="p-3 pt-0 sm:p-4 sm:pt-0">
			{#if isEditing}
				<textarea
					bind:value={editedDescription}
					class="min-h-[200px] w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-transparent"
					placeholder="Enter job description..."
					maxLength={1000}
				/>
			{:else}
				<div class="prose prose-xs dark:prose-invert max-w-none text-sm leading-relaxed">
					<Markdown md={job.description} />
				</div>
			{/if}
		</CardContent>
	</Card>
{/if}
