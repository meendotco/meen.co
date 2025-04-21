<script lang="ts">
	import { Briefcase, Calendar, DollarSign, Globe, LinkedinIcon, MapPin } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';

	let { data } = $props();
	const post = $derived(data.post);

	function applyWithLinkedin() {
		// This would typically redirect to a LinkedIn OAuth flow or open a modal
		// For now, we'll just log the action
		// You would implement the actual LinkedIn integration here
	}

	function formatDate(date: Date | string | null) {
		if (!date) return 'Posted 4/19/2025';
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
	<div class="flex flex-col space-y-1.5">
		<div class="mb-4">
			<Button
				variant="outline"
				class="flex items-center gap-2 text-sm"
				onclick={() => history.back()}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-4 w-4"
				>
					<path d="m15 18-6-6 6-6" />
				</svg>
				Back
			</Button>
		</div>
		<h1 class="text-2xl font-bold tracking-tight">{post?.title}</h1>
		<p class="text-muted-foreground">{post?.department || 'Job Details'}</p>
	</div>

	<div class="relative flex flex-col rounded-lg border border-border/50 bg-[#0B0B0B] p-6 shadow-sm">
		<div class="mb-6">
			<div class="mb-4 flex flex-wrap gap-2 text-xs">
				{#if post?.location}
					<span class="flex items-center gap-1 rounded-md bg-[#27272A] px-2 py-1">
						<MapPin class="h-3 w-3" />
						<span>{post.location}</span>
					</span>
				{/if}
				{#if post?.type}
					<span class="flex items-center gap-1 rounded-md bg-[#27272A] px-2 py-1">
						<Briefcase class="h-3 w-3" />
						<span>{post.type}</span>
					</span>
				{/if}
				{#if post?.remote_policy}
					<span class="flex items-center gap-1 rounded-md bg-[#27272A] px-2 py-1">
						<Globe class="h-3 w-3" />
						<span>{post.remote_policy}</span>
					</span>
				{/if}
				{#if post?.salary}
					<span class="flex items-center gap-1 rounded-md bg-[#27272A] px-2 py-1">
						<DollarSign class="h-3 w-3" />
						<span>{post.salary}</span>
					</span>
				{/if}
			</div>

			<div class="text-xs text-muted-foreground">
				<span class="flex items-center gap-1">
					<Calendar class="h-3 w-3" />
					{formatDate(post?.createdAt)}
				</span>
			</div>
		</div>

		{#if post?.description}
			<div class="mb-6">
				<h2 class="mb-2 text-base font-medium">Description</h2>
				<p class="text-sm text-muted-foreground">{post.description}</p>
			</div>
		{/if}

		{#if post?.responsibilities}
			<div class="mb-6">
				<h2 class="mb-2 text-base font-medium">Responsibilities</h2>
				<p class="text-sm text-muted-foreground">{post.responsibilities}</p>
			</div>
		{/if}

		{#if post?.requirements}
			<div class="mb-6">
				<h2 class="mb-2 text-base font-medium">Requirements</h2>
				<p class="text-sm text-muted-foreground">{post.requirements}</p>
			</div>
		{/if}

		{#if post?.benefits}
			<div class="mb-6">
				<h2 class="mb-2 text-base font-medium">Benefits</h2>
				<p class="text-sm text-muted-foreground">{post.benefits}</p>
			</div>
		{/if}

		{#if post?.tech_stack}
			<div class="mb-6">
				<h2 class="mb-2 text-base font-medium">Tech Stack</h2>
				<p class="text-sm text-muted-foreground">{post.tech_stack}</p>
			</div>
		{/if}

		<div class="mt-auto pt-4">
			{#if data.user && data.user.organizationHandle === post?.ownerOrganizationHandle}
				<div class="rounded bg-[#27272A]/50 px-4 py-3">
					<p class="mb-2 text-xs text-muted-foreground">
						Looks like you're the owner of this job post.
					</p>
					<Button href={`/dashboard/job/${post?.id}`} variant="default" size="sm">
						See Applicants
					</Button>
				</div>
			{:else}
				<Button
					on:click={applyWithLinkedin}
					class="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
				>
					<LinkedinIcon class="h-4 w-4" />
					Apply with LinkedIn
				</Button>
			{/if}

			{#if post?.priority === 'High'}
				<div class="absolute right-2 top-2">
					<span class="rounded-full bg-[#6D2EE0]/20 px-2 py-0.5 text-xs font-medium text-[#7E3AF2]">
						{post.priority}
					</span>
				</div>
			{/if}
		</div>
	</div>
</div>
