<script lang="ts">
	import { LinkedinIcon } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';

	let { data } = $props();
	const post = $derived(data.post);

	function applyWithLinkedin() {
		// This would typically redirect to a LinkedIn OAuth flow or open a modal
		// For now, we'll just log the action
		console.log('Applying with LinkedIn for job:', post?.id);
		// You would implement the actual LinkedIn integration here
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold">{post?.title}</h1>
		{#if post?.department}
			<div class="mb-1 text-sm text-gray-600">Department: {post.department}</div>
		{/if}
		{#if post?.location}
			<div class="mb-1 text-sm text-gray-600">Location: {post.location}</div>
		{/if}
		{#if post?.type}
			<div class="mb-1 text-sm text-gray-600">Job Type: {post.type}</div>
		{/if}
		{#if post?.remote_policy}
			<div class="mb-1 text-sm text-gray-600">Remote Policy: {post.remote_policy}</div>
		{/if}
		{#if post?.salary}
			<div class="mb-1 text-sm text-gray-600">Salary: {post.salary}</div>
		{/if}
	</div>

	{#if post?.description}
		<div class="mb-6">
			<h2 class="mb-2 text-xl font-semibold">Description</h2>
			<p class="whitespace-pre-line">{post.description}</p>
		</div>
	{/if}

	{#if post?.responsibilities}
		<div class="mb-6">
			<h2 class="mb-2 text-xl font-semibold">Responsibilities</h2>
			<p class="whitespace-pre-line">{post.responsibilities}</p>
		</div>
	{/if}

	{#if post?.requirements}
		<div class="mb-6">
			<h2 class="mb-2 text-xl font-semibold">Requirements</h2>
			<p class="whitespace-pre-line">{post.requirements}</p>
		</div>
	{/if}

	{#if post?.benefits}
		<div class="mb-6">
			<h2 class="mb-2 text-xl font-semibold">Benefits</h2>
			<p class="whitespace-pre-line">{post.benefits}</p>
		</div>
	{/if}

	{#if post?.tech_stack}
		<div class="mb-6">
			<h2 class="mb-2 text-xl font-semibold">Tech Stack</h2>
			<p class="whitespace-pre-line">{post.tech_stack}</p>
		</div>
	{/if}

	<div class="row mt-8 flex flex gap-4">
		{#if data.user && data.user.organizationHandle === post?.ownerOrganizationHandle}
			<div class="">
				<p class="text-sm text-accent/50">Looks like you're the owner of this job post.</p>
				<Button href={`/dashboard/jobs/${post?.id}`}>Edit Job</Button>
			</div>
		{:else}
			<Button
				on:click={applyWithLinkedin}
				class="flex items-center gap-2 bg-[#0077B5] hover:bg-[#0077B5]/90"
			>
				<LinkedinIcon class="h-4 w-4" />
				Apply with LinkedIn
			</Button>
		{/if}
	</div>
</div>
