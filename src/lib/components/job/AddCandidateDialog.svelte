<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';

	let isOpen = $state(false);
	let linkedinUrl = $state('');
	let isLoading = $state(false);

	const { jobId } = $props<{ jobId: string }>();
	async function handleSubmit() {
		if (!linkedinUrl) {
			toast.error('Please enter a LinkedIn URL');
			return;
		}

		isLoading = true;
		try {
			isOpen = false;

			const loadingToast = toast.loading(`Adding ${linkedinUrl}...`, {
				duration: Infinity
			});

			const response = await fetch(`/api/job/${jobId}/addlinkedin`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ linkedinUrl })
			});

			// Dismiss the loading toast
			toast.dismiss(loadingToast);

			if (!response.ok) {
				throw new Error('Failed to add candidate');
			}

			toast.success('Candidate added successfully');

			linkedinUrl = '';
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to add candidate');
		} finally {
			isLoading = false;
		}
	}
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Trigger asChild>
		<Button onclick={() => (isOpen = true)} variant="outline">Add via LinkedIn</Button>
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<h2 class="text-lg font-semibold">Add Candidate via LinkedIn</h2>
		<p class="text-sm text-muted-foreground">
			Enter the LinkedIn profile URL of the candidate you want to add.
		</p>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="linkedin-url" class="text-right">LinkedIn URL</Label>
				<Input
					id="linkedin-url"
					class="col-span-3"
					placeholder="https://www.linkedin.com/in/username"
					bind:value={linkedinUrl}
				/>
			</div>
		</div>
		<div class="flex justify-end gap-2">
			<Button variant="outline" on:click={() => (isOpen = false)}>Cancel</Button>
			<Button onclick={handleSubmit} disabled={isLoading}>
				{isLoading ? 'Adding...' : 'Add Candidate'}
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
