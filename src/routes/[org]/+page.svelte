<script lang="ts">
	import { Briefcase, Calendar, MapPin } from 'lucide-svelte';
	import { onMount } from 'svelte';

	import { Skeleton } from '$lib/components/ui/skeleton';

	let { data } = $props();
	let jobs = $derived(data.jobs);
	let orgData = $derived(data.orgData);
	let loading = $state(true);
	let themeColor = $derived(orgData.theme);
	let logoUrl = $derived(orgData.logo);

	onMount(() => {
		loading = false;
	});
</script>

<section
	class="mx-auto flex h-full w-full max-w-screen-xl flex-col space-y-8 px-4 py-6 sm:px-6 md:px-8 lg:px-12"
>
	<div class="flex flex-col space-y-4">
		<div class="flex items-center gap-4">
			{#if loading}
				<Skeleton class="h-12 w-12 rounded-md" />
				<div class="flex flex-col space-y-1.5">
					<Skeleton class="h-8 w-64" />
					<Skeleton class="h-5 w-48" />
				</div>
			{:else}
				<div class="h-12 w-12 overflow-hidden rounded-md border border-border/50 bg-card">
					{#if logoUrl}
						<img
							src={logoUrl}
							alt={`${orgData.handle || 'Organization'} logo`}
							class="h-full w-full object-contain"
						/>
					{:else}
						<div
							class="flex h-full w-full items-center justify-center bg-muted text-lg font-bold uppercase text-muted-foreground"
						>
							{orgData.handle?.[0] || 'O'}
						</div>
					{/if}
				</div>
				<div>
					<h1 class="text-2xl font-bold tracking-tight">
						{orgData.handle || 'Organization'}
					</h1>
					<p class="text-muted-foreground">Job listings for this organization</p>
				</div>
			{/if}
		</div>
	</div>

	{#if loading}
		<Skeleton class="mb-2 mt-8 h-8 w-40 rounded" />
		<div class="grid auto-rows-fr grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(3), i (i)}
				<div
					class="flex h-full flex-col rounded-xl border border-border/50 bg-card p-5 shadow-sm transition-colors hover:bg-muted/80 dark:bg-card dark:hover:bg-muted/20"
				>
					<Skeleton class="mb-4 h-4 w-5/6" />

					<div class="mt-auto flex items-center justify-between">
						<Skeleton class="h-4 w-32" />
					</div>
				</div>
			{/each}
		</div>
		<Skeleton class="mb-2 mt-8 h-8 w-40 rounded" />
		<div class="grid auto-rows-fr grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6), i (i)}
				<div
					class="flex h-full flex-col rounded-xl border border-border/50 bg-card p-5 shadow-sm transition-colors hover:bg-muted/80 dark:bg-card dark:hover:bg-muted/20"
				>
					<Skeleton class="mb-4 h-4 w-5/6" />

					<div class="mt-auto flex items-center justify-between">
						<Skeleton class="h-4 w-32" />
					</div>
				</div>
			{/each}
		</div>
	{:else if Object.keys(jobs).length === 0}
		<div
			class="col-span-full flex h-40 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 text-center"
		>
			<Briefcase class="mb-2 h-8 w-8 text-muted-foreground/60" />
			<h3 class="text-lg font-medium">No jobs found</h3>
			<p class="text-sm text-muted-foreground">No job listings available for this organization.</p>
		</div>
	{:else}
		<section class="space-y-8">
			{#each Object.entries(jobs) as [department, deptJobs]}
				<h2 class="text-2xl font-bold">{department}</h2>
				<div
					class="m-0 grid auto-rows-fr grid-cols-1 gap-5 p-0 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
				>
					{#each deptJobs as job (job.id)}
						<a href="/{job.ownerOrganizationHandle}/{job.handle}" class="h-full">
							<div
								class="flex h-full flex-col rounded-xl border border-border/50 bg-card p-5 shadow-sm transition-colors hover:bg-muted/80 dark:bg-card dark:hover:bg-muted/20"
							>
								<h3 class="mb-2 line-clamp-2 text-card-foreground">{job.title}</h3>
								<div class="mt-auto">
									{#if job.location}
										<div class="flex items-center gap-1 text-xs text-muted-foreground">
											<MapPin class="h-3.5 w-3.5" />
											<span>{job.location}</span>
										</div>
									{/if}
								</div>
							</div>
						</a>
					{/each}
				</div>
			{/each}
		</section>
	{/if}
</section>
