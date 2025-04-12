<script lang="ts">
	import { Briefcase, PlusCircle } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Card } from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	let { data } = $props();

	let jobName = $state('Software Engineer');
	let jobDescription = $state('Software Engineer at Google specializing in React and TypeScript');
	let isSubmitting = $state(false);

	function createJob() {
		return goto('/dashboard/jobs/create');
	}
</script>

<div class="container mx-auto flex flex-col gap-6 py-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight">All Jobs</h1>
		<Button onclick={createJob}>
			<PlusCircle class="mr-2 h-4 w-4" />
			Create Job
		</Button>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#if data?.jobs?.length > 0}
			{#each data.jobs as job (job.id)}
				<Card class="transition-all hover:shadow-md dark:border-border dark:bg-card">
					<a href={`/dashboard/jobs/${job.id}`} class="flex h-full flex-col justify-between p-6">
						<div class="flex flex-col gap-3">
							<div class="flex items-center gap-2">
								<Briefcase class="h-5 w-5 text-primary" />
								<h2 class="text-xl font-semibold">
									{#if job.title.length > 20}
										{job.title.slice(0, 20)}...
									{:else}
										{job.title}
									{/if}
								</h2>
							</div>
							<p class="text-sm text-muted-foreground">
								{#if job.description.length > 100}
									{job.description.slice(0, 100)}...
								{:else}
									{job.description}
								{/if}
							</p>
						</div>
						<div class="mt-4 flex items-center justify-between text-xs text-muted-foreground">
							<span>Created {new Date().toLocaleDateString()}</span>
							<span class="flex items-center gap-1">
								<div class="h-2 w-2 rounded-full bg-green-500"></div>
								Active
							</span>
						</div>
					</a>
				</Card>
			{/each}
		{:else}
			<div
				class="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border p-12 text-center"
			>
				<Briefcase class="h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-medium">No jobs yet</h3>
				<p class="text-sm text-muted-foreground">Create your first job to attract candidates.</p>

				<Button class={buttonVariants({ variant: 'outline' })} onclick={createJob}>
					<PlusCircle class="mr-2 h-4 w-4 text-foreground" />
					<span class="text-foreground">Create your first job</span>
				</Button>
			</div>
		{/if}
	</div>
</div>
