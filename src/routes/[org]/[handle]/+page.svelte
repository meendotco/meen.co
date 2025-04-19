<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();
	const post = $derived(data.post);
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

	<div class="mt-8">
		<Button>Apply Now</Button>
	</div>
</div>
