<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	let { data } = $props();

	let jobName = $state('Software Engineer');
	let jobDescription = $state('Software Engineer at Google specializing in React and TypeScript');
	let isSubmitting = $state(false);

	async function createJob() {
		isSubmitting = true;
		try {
			const response = await fetch('/api/jobs/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: jobName,
					description: jobDescription
				})
			});

			if (response.ok) {
				// Refresh the page to show the new job
				window.location.reload();
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">All Jobs</h1>

		<Dialog.Root>
			<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>Create Job</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-[425px]">
				<Dialog.Header>
					<Dialog.Title>Create Job</Dialog.Title>
					<Dialog.Description>Create a new job post</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4 py-4">
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="name" class="text-right">Job Name</Label>
						<Input id="name" bind:value={jobName} class="col-span-3" />
					</div>
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="description" class="text-right">Description</Label>
						<Textarea id="description" bind:value={jobDescription} class="col-span-3 min-h-48" />
					</div>
				</div>
				<Dialog.Footer>
					<Button type="submit" onclick={createJob} disabled={isSubmitting}>
						{isSubmitting ? 'Creating...' : 'Create Job'}
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#if data?.jobs.length > 0}
			{#each data.jobs as job (job.id)}
				<a
					href={`/dashboard/jobs/${job.id}`}
					class="flex flex-col gap-2 rounded-lg border border-white/10 p-4"
				>
					<h2 class="text-lg font-bold">{job.name}</h2>
					<p class="text-sm text-gray-500">{job.description}</p>
				</a>
			{/each}
		{:else}
			<p class="text-sm text-gray-500">No jobs yet. Create one!</p>
		{/if}
	</div>
</div>
