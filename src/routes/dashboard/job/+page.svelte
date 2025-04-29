<script lang="ts">
	import { Briefcase, PlusCircle, Trash2 } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import { goto } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card } from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { Job } from '$lib/types/job';
	import { socket } from '$lib/websocket/client.svelte';
	let { data } = $props();
	let deleteJobDialogOpen = $state(false);

	type StreamedJob = Omit<
		Job,
		| 'benefits'
		| 'createdAt'
		| 'location'
		| 'priority'
		| 'remote_policy'
		| 'requirements'
		| 'responsibilities'
		| 'salary'
		| 'status'
		| 'tech_stack'
		| 'type'
	> & { createdAt: Date | string; isNew?: boolean };

	let jobsList = $state<StreamedJob[]>([]);
	let isLoadingJobs = $state(true);
	let jobIsCreating = $state(false);
	let jobURL = $state('');
	let dialogOpen = $state(false);
	let currentJobID = $state('');

	onMount(() => {
		async function loadJobs() {
			const initialJobs = await data.streamed.jobs;
			if (initialJobs) {
				isLoadingJobs = false;
				jobsList = initialJobs.map((job) => ({ ...job, isNew: false }));
			}
		}
		loadJobs();
	});

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

	async function deleteJob(jobId: string) {
		deleteJobDialogOpen = false;
		const deletingToast = toast.loading('Deleting job...');
		const response = await fetch(`/api/job/${jobId}`, {
			method: 'DELETE'
		});
		if (response.ok) {
			jobsList = jobsList.filter((job) => job.id !== jobId);
			toast.dismiss(deletingToast);
			toast.success('Job deleted');
		} else {
			toast.dismiss(deletingToast);
			toast.error('Failed to delete job');
		}
	}

	onMount(() => {
		socket.on('job-created', (job: StreamedJob) => {
			if (!jobsList.some((j) => j.id === job.id)) {
				jobsList = [{ ...job, isNew: true }, ...jobsList];
			}
			toast.success('Job created');
		});
	});
</script>

<div class="container mx-auto py-8">
	<div class="mb-8 flex flex-col space-y-4">
		<h1 class="text-4xl font-bold tracking-tight">Job Listings</h1>
		<p class="text-muted-foreground">Manage and track your active recruitment campaigns</p>

		<div class="mt-6 flex justify-end">
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
					<Dialog.Content class="border border-border/40 bg-card/90 backdrop-blur-md sm:max-w-md">
						<Dialog.Header>
							<Dialog.Title class="text-xl font-semibold text-primary"
								>Add existing job</Dialog.Title
							>
							<Dialog.Description class="text-muted-foreground">
								Enter the URL of a job listing you'd like to import and analyze
							</Dialog.Description>
						</Dialog.Header>
						<div class="py-4">
							<p class="p-2 text-sm font-semibold">Job post URL:</p>
							<Input
								type="url"
								placeholder="https://www.linkedin.com/job/view/3724600000"
								bind:value={jobURL}
								class="border-border/40 bg-background/60 transition-all duration-300 focus-visible:border-primary/30 focus-visible:ring-primary/20"
							/>
						</div>
						<Dialog.Footer class="flex justify-end gap-2">
							<Dialog.Close asChild>
								<Button variant="outline" class="border-border/40 hover:bg-background/80"
									>Cancel</Button
								>
							</Dialog.Close>
							<Button
								disabled={jobIsCreating}
								onclick={createJobByURL}
								class="bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90"
							>
								{#if jobIsCreating}
									<span class="flex items-center">
										<div
											class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
										></div>
										Importing...
									</span>
								{:else}
									<span class="flex items-center">
										<PlusCircle class="mr-2 h-4 w-4" />
										Import
									</span>
								{/if}
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
				<Button
					onclick={createJob}
					class="bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90"
				>
					<PlusCircle class="mr-2 h-4 w-4" />
					Create New Job
				</Button>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#if isLoadingJobs}
			{#each [...Array(6).keys()] as i (i)}
				<Card
					class="group overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
				>
					<div class="flex h-full flex-col justify-between p-6">
						<div class="flex flex-col gap-4">
							<div class="mb-4 flex items-start gap-3">
								<div class="rounded-full bg-primary/10 p-2">
									<Skeleton class="h-5 w-5 rounded-full" />
								</div>
								<div>
									<Skeleton class="h-5 w-40" />
									<Skeleton class="mt-1 h-3 w-24" />
								</div>
							</div>
							<div class="space-y-2">
								<Skeleton class="h-3 w-full" />
								<Skeleton class="h-3 w-5/6" />
								<Skeleton class="h-3 w-4/6" />
							</div>
						</div>
						<div
							class="mt-6 flex items-center justify-between border-t border-border/30 pt-4 text-xs"
						>
							<Skeleton class="h-3 w-24" />
							<Skeleton class="h-5 w-16 rounded-full" />
						</div>
					</div>
				</Card>
			{/each}
		{:else if jobsList.length > 0}
			{#each jobsList as job (job.id)}
				<Card
					class="group relative overflow-hidden border border-border/40 bg-card/50 p-2 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
				>
					<Button
						onclick={() => {
							deleteJobDialogOpen = true;
							currentJobID = job.id;
						}}
						variant="ghost"
						class="absolute right-2 top-2 z-10 hover:bg-red-500/10"
					>
						<Trash2 class="h-4 w-4 text-red-500" />
					</Button>

					<a href={`/dashboard/job/${job.id}`} class="flex h-full flex-col justify-between p-6">
						<div class="flex flex-col gap-4">
							<div class="flex items-start gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
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
										{#if job.isNew}
											<Badge variant="outline" class="ml-2 border-green-500 text-green-500"
												>New</Badge
											>
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
								class="flex items-center gap-2 rounded-full px-2 py-1 font-medium {job.status ===
									'Active' || job.status === null
									? 'bg-green-500/10 text-green-500'
									: 'bg-red-500/10 text-red-500'}"
							>
								<div
									class="h-2 w-2 rounded-full {job.status === 'Active' || job.status === null
										? 'bg-green-500'
										: 'bg-red-500'}"
								></div>
								{job.status || 'Active'}
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
					<h3 class="text-2xl font-medium text-primary">No job listings yet</h3>
					<p class="mt-2 text-muted-foreground">
						Create your first job listing to start attracting top talent.
					</p>
				</div>

				<Button
					onclick={createJob}
					class="mt-2 bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90"
				>
					<PlusCircle class="mr-2 h-4 w-4" />
					<span>Create your first job</span>
				</Button>
			</div>
		{/if}
	</div>
</div>

<Dialog.Root bind:open={deleteJobDialogOpen}>
	<Dialog.Content>
		<h1 class="text-2xl font-bold">Delete Job</h1>
		<p class="text-sm text-muted-foreground">
			Are you sure you want to delete this job? This action cannot be undone.
		</p>
		<Dialog.Footer>
			<Dialog.Close asChild>
				<Button
					onclick={() => {
						deleteJobDialogOpen = false;
						currentJobID = '';
					}}
					variant="outline"
					class="border-border/40 hover:bg-background/80"
				>
					Cancel
				</Button>
			</Dialog.Close>
			<Button onclick={() => deleteJob(currentJobID)} variant="destructive">Delete Job</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
