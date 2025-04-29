<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';
	import { Pencil, X, Plus } from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import type { jobPost as jobPostTable } from '$lib/server/db/schema';

	import { toast } from 'svelte-sonner';
	type JobPostSelect = InferSelectModel<typeof jobPostTable>;

	let { job } = $props<{ job: JobPostSelect }>();
	let isEditing = $state(false);
	let editedTechStack = $state(job.tech_stack ?? '');
	let editedRemotePolicy = $state(job.remote_policy ?? '');
	let newTech = $state('');
	let isSending = $state(false);
	let popoverOpen = $state(false);
	let popoverRef = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (popoverOpen) {
			const handleClickOutside = (event: MouseEvent) => {
				if (popoverRef && !popoverRef.contains(event.target as Node)) {
					popoverOpen = false;
				}
			};

			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	function handleEdit() {
		isEditing = true;
	}

	async function handleSave() {
		isSending = true;
		try {
			const loadingToast = toast.loading('Updating job details...', {
				duration: Infinity
			});
			const techStack = editedTechStack?.trim() ?? '';
			const remotePolicy = editedRemotePolicy?.trim() ?? '';
			const response = await fetch(`/api/job/${job.id}/edit`, {
				method: 'PATCH',
				body: JSON.stringify({
					tech_stack: techStack,
					remote_policy: remotePolicy
				})
			});
			toast.dismiss(loadingToast);
			if (!response.ok) {
				throw new Error('Failed to update job details');
			}

			job.tech_stack = editedTechStack;
			job.remote_policy = editedRemotePolicy;
			toast.success('Job details updated successfully');
		} catch (error) {
			console.error('Error updating job details:', error);
			toast.error('Failed to update job details');
		}
		isEditing = false;
		isSending = false;
	}

	function handleCancel() {
		editedTechStack = job.tech_stack ?? '';
		editedRemotePolicy = job.remote_policy ?? '';
		isEditing = false;
	}

	function removeTechStack(tech: string) {
		const techs = editedTechStack
			.split(',')
			.map((t: string) => t.trim())
			.filter(Boolean);
		editedTechStack = techs.filter((t: string) => t !== tech).join(',');
	}

	function addTechStack() {
		if (!newTech.trim()) return;
		if (!editedTechStack) {
			editedTechStack = newTech.trim();
		} else {
			const techs = editedTechStack
				.split(',')
				.map((t: string) => t.trim())
				.filter(Boolean);
			if (!techs.includes(newTech.trim())) {
				techs.push(newTech.trim());
				editedTechStack = techs.join(',');
			}
		}
		newTech = '';
		popoverOpen = false;
	}
</script>

<Card>
	<CardHeader class="flex flex-row items-center justify-between p-3 pb-2 sm:p-4 sm:pb-2">
		<CardTitle class="text-sm sm:text-base">Requirements & Benefits</CardTitle>
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
				<Button variant="link" size="icon" onclick={handleEdit} title="Edit">
					<Pencil class="h-4 w-4" />
				</Button>
			{/if}
		</div>
	</CardHeader>
	<CardContent class="p-3 pt-0 sm:p-4 sm:pt-0">
		<div class="space-y-3">
			<div>
				{#if (job.tech_stack && job.tech_stack.length > 0) || isEditing}
					<p class="mb-1 text-xs font-medium sm:text-sm">Tech Stack</p>
					{#if isEditing}
						<div class="space-y-2">
							<div class="flex flex-wrap gap-1">
								{#if editedTechStack}
									{#each editedTechStack
										.split(',')
										.map((t: string) => t.trim())
										.filter(Boolean) as tech (tech)}
										<Badge variant="outline" class="group bg-muted/50 text-xs font-normal">
											<div class="flex items-center gap-1">
												<button
													class="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-all hover:bg-red-500 hover:text-white"
													onclick={() => removeTechStack(tech)}
												>
													<X class="h-3 w-3" />
												</button>
												{tech}
											</div>
										</Badge>
									{/each}
								{/if}
								<Badge
									variant="outline"
									class="relative cursor-pointer bg-muted/50 text-xs font-normal"
									onclick={(e: MouseEvent) => {
										e.stopPropagation();
										popoverOpen = true;
									}}
								>
									<Plus class="h-3 w-3" />
									{#if popoverOpen}
										<div
											bind:this={popoverRef}
											class="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border bg-card p-2 shadow-md"
											onclick={(e: MouseEvent) => e.stopPropagation()}
										>
											<p class="mb-1 text-xs font-medium sm:text-sm">Tech Stack</p>
											<Input
												bind:value={newTech}
												class="h-8 text-xs focus-visible:ring-transparent sm:text-sm"
												placeholder="Enter technology"
												onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && addTechStack()}
											/>
											<div class="mt-2 flex justify-end">
												<Button size="sm" class="w-full" onclick={addTechStack}>Add</Button>
											</div>
											<div
												class="absolute -top-2 left-2 h-2 w-2 rotate-45 border-l border-t bg-card"
											></div>
										</div>
									{/if}
								</Badge>
							</div>
						</div>
					{:else}
						<div class="flex flex-wrap gap-1">
							{#each job.tech_stack
								.split(',')
								.map((t: string) => t.trim())
								.filter(Boolean) as tech (tech)}
								<Badge variant="outline" class="bg-muted/50 text-xs font-normal">
									{tech}
								</Badge>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
			<div>
				{#if isEditing || (job.remote_policy && job.remote_policy.trim().length !== 0)}
					<div class="mt-3">
						<p class="mb-1 text-xs font-medium sm:text-sm">Remote Policy</p>
						{#if isEditing}
							<Textarea
								bind:value={editedRemotePolicy}
								class="h-8 text-xs focus-visible:ring-transparent sm:text-sm"
								placeholder="Enter remote policy"
							/>
						{:else}
							<p class="text-xs text-muted-foreground sm:text-sm">
								{job.remote_policy}
							</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</CardContent>
</Card>
