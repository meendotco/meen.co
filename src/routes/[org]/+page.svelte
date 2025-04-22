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

	function formatDate(date: Date | string | null) {
		if (!date) return 'Posted 2/2/2025';
		return (
			'Posted ' +
			new Date(date).toLocaleDateString('en-US', {
				month: 'numeric',
				day: 'numeric',
				year: 'numeric'
			})
		);
	}
</script>

<div
	class="mx-auto flex h-full w-full max-w-screen-xl flex-col space-y-8 px-4 py-6 sm:px-6 md:px-8 lg:px-12"
>
	<!-- Page header with organization info -->
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

	<!-- Job listings grid with consistent sizing -->
	<div class="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#if loading}
			{#each Array(6), i (i)}
				<div
					class="h-64 rounded-lg border border-border/50 bg-card p-4 shadow-sm dark:bg-[#0B0B0B]"
				>
					<Skeleton class="mb-3 h-7 w-3/4" />
					<Skeleton class="mb-3 h-4 w-full" />
					<Skeleton class="mb-4 h-4 w-5/6" />

					<div class="mb-4 flex flex-wrap gap-2">
						<Skeleton class="h-6 w-24 rounded-md" />
						<Skeleton class="h-6 w-20 rounded-md" />
					</div>

					<div class="mt-auto flex items-center justify-between">
						<Skeleton class="h-8 w-24 rounded-md" />
						<Skeleton class="h-4 w-32" />
					</div>
				</div>
			{/each}
		{:else if jobs.length === 0}
			<div
				class="col-span-full flex h-40 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 text-center"
			>
				<Briefcase class="mb-2 h-8 w-8 text-muted-foreground/60" />
				<h3 class="text-lg font-medium">No jobs found</h3>
				<p class="text-sm text-muted-foreground">
					No job listings available for this organization.
				</p>
			</div>
		{:else}
			{#each jobs as job (job.id)}
				<div
					class="relative flex h-64 flex-col rounded-lg border border-border/50 bg-card p-4 shadow-sm transition duration-200 hover:shadow-md dark:bg-[#0B0B0B]"
				>
					<h3 class="mb-2 line-clamp-1 text-lg font-medium text-card-foreground">{job.title}</h3>

					<div class="mb-3 text-sm text-muted-foreground">
						{#if job.description}
							<p class="line-clamp-2">{job.description}</p>
						{/if}
					</div>

					<div class="mb-4 flex flex-wrap gap-2 text-xs">
						{#if job.location}
							<span
								class="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-muted-foreground dark:bg-[#27272A]"
							>
								<MapPin class="h-3 w-3" />
								<span>{job.location}</span>
							</span>
						{/if}

						{#if job.type}
							<span class="rounded-md bg-muted px-2 py-1 text-muted-foreground dark:bg-[#27272A]">
								{job.type}
							</span>
						{/if}
					</div>

					<div class="mt-auto flex items-center justify-between">
						<a
							href="/{job.ownerOrganizationHandle}/{job.handle}"
							class="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
							style={themeColor ? `background-color: ${themeColor}; color: white;` : ''}
						>
							View Details
						</a>

						<span class="text-xs text-muted-foreground">
							<span class="flex items-center gap-1">
								<Calendar class="h-3 w-3" />
								{formatDate(job.createdAt)}
							</span>
						</span>
					</div>

					{#if job.priority === 'High'}
						<div class="absolute right-2 top-2">
							<span
								class="rounded-full px-2 py-0.5 text-xs font-medium"
								style={themeColor
									? `color: ${themeColor}; background-color: ${themeColor}20;`
									: 'background-color: #6D2EE020; color: #7E3AF2;'}
							>
								{job.priority}
							</span>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
