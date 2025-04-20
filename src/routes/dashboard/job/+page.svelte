<script lang="ts">
	import { Briefcase, PlusCircle } from 'lucide-svelte';

	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card } from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	let { data } = $props();

	let jobIsCreating = $state(false);
	let jobURL = $state('');
	let dialogOpen = $state(false);

	function createJob() {
		return goto('/dashboard/job/create');
	}

	async function createJobByURL() {
		jobIsCreating = true;
		await fetch('/api/job/create/url', {
			method: 'POST',
			body: JSON.stringify({
				url: jobURL
			})
		});

		jobIsCreating = false;
		dialogOpen = false;
	}
</script>

<div class="container mx-auto flex flex-col gap-8 py-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1
				class="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent"
			>
				Job Listings
			</h1>
			<p class="mt-1 text-muted-foreground">Manage and track your active recruitment campaigns</p>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<Dialog.Root bind:open={dialogOpen}>
				<Dialog.Trigger>
					<Button
						variant="outline"
						class="border-primary/20 transition-all duration-300 hover:bg-primary/5"
					>
						<PlusCircle class="mr-2 h-4 w-4 text-primary" />
						Add existing job
					</Button>
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-md">
					<Dialog.Header>
						<Dialog.Title class="text-xl">Import Existing Job</Dialog.Title>
						<Dialog.Description class="text-muted-foreground">
							Enter the URL of a job listing you'd like to import and analyze
						</Dialog.Description>
					</Dialog.Header>
					<div class="py-4">
						<Input
							type="url"
							placeholder="https://www.linkedin.com/job/view/3724600000"
							bind:value={jobURL}
							class="transition-all duration-300 focus-visible:ring-primary/20"
						/>
					</div>
					<Dialog.Footer class="flex justify-end gap-2">
						<Dialog.Close asChild>
							<Button variant="outline">Cancel</Button>
						</Dialog.Close>
						<Button
							disabled={jobIsCreating}
							onclick={createJobByURL}
							class="group relative overflow-hidden"
						>
							{#if jobIsCreating}
								<span class="flex items-center">
									<div
										class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"
									></div>
									Adding...
								</span>
							{:else}
								<span class="flex items-center">
									<PlusCircle class="mr-2 h-4 w-4" />
									Add job
								</span>
							{/if}
							<span
								class="absolute inset-0 translate-y-[100%] bg-primary/10 transition-transform duration-300 group-hover:translate-y-0"
							></span>
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
			<Button
				onclick={createJob}
				class="bg-gradient-to-r from-primary to-primary/80 shadow-md transition-all duration-300 hover:from-primary/90 hover:to-primary/70 hover:shadow-lg"
			>
				<PlusCircle class="mr-2 h-4 w-4" />
				Create New Job
			</Button>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#await data.streamed.jobs}
			<div class="col-span-full flex items-center justify-center p-16">
				<div class="flex flex-col items-center">
					<div class="relative h-12 w-12">
						<div
							class="absolute inset-0 h-full w-full animate-ping rounded-full bg-primary/20 duration-1000"
						></div>
						<div
							class="absolute inset-0 h-full w-full animate-spin rounded-full border-4 border-primary/30 border-t-primary"
						></div>
					</div>
					<p class="mt-4 text-sm font-medium text-muted-foreground">Loading your job listings...</p>
				</div>
			</div>
		{:then jobs}
			{#if jobs.length > 0}
				{#each jobs as job (job.id)}
					<Card
						class="group overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 dark:border-border/30 dark:bg-card/80"
					>
						<a href={`/dashboard/job/${job.id}`} class="flex h-full flex-col justify-between p-6">
							<div class="flex flex-col gap-4">
								<div class="flex items-start gap-3">
									<div
										class="rounded-full bg-primary/10 p-2 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
									>
										<Briefcase class="h-5 w-5" />
									</div>
									<div>
										<h2
											class="text-xl font-semibold transition-colors duration-300 group-hover:text-primary"
										>
											{#if job.title.length > 20}
												{job.title.slice(0, 20)}...
											{:else}
												{job.title}
											{/if}
										</h2>
										<p class="text-xs text-muted-foreground">{job.department || 'No department'}</p>
									</div>
								</div>
								<p class="text-sm text-muted-foreground">
									{#if job.description.length > 100}
										{job.description.slice(0, 100)}...
									{:else}
										{job.description}
									{/if}
								</p>
							</div>
							<div
								class="mt-6 flex items-center justify-between border-t border-border/30 pt-4 text-xs"
							>
								<span class="text-muted-foreground"
									>Created {new Date(job.createdAt).toLocaleDateString()}</span
								>
								<span
									class="flex items-center gap-2 rounded-full bg-green-500/10 px-2 py-1 font-medium text-green-500"
								>
									<div class="h-2 w-2 rounded-full bg-green-500"></div>
									Active
								</span>
							</div>
						</a>
					</Card>
				{/each}
			{:else}
				<div
					class="col-span-full flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-border/50 bg-card/30 p-16 text-center backdrop-blur-sm"
				>
					<div class="rounded-full bg-primary/10 p-6">
						<Briefcase class="h-12 w-12 text-primary" />
					</div>
					<div>
						<h3 class="text-2xl font-medium">No job listings yet</h3>
						<p class="mt-2 text-muted-foreground">
							Create your first job listing to start attracting top talent.
						</p>
					</div>

					<Button
						onclick={createJob}
						class="mt-2 bg-gradient-to-r from-primary to-primary/80 shadow-md transition-all duration-300 hover:from-primary/90 hover:to-primary/70 hover:shadow-lg"
					>
						<PlusCircle class="mr-2 h-4 w-4" />
						<span>Create your first job</span>
					</Button>
				</div>
			{/if}
		{/await}
	</div>
</div>
