<script lang="ts">
	let { data } = $props();
</script>

{#if data.job}
	<div>
		<h1>{data.job.name}</h1>
		<p>{data.job.description}</p>
	</div>
{:else}
	<p>Job not found</p>
{/if}
