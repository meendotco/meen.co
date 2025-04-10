<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { data, children } = $props();
</script>

<div class="flex min-h-screen">
	<Sidebar user={data.user} />

	<div class="flex flex-1 flex-col lg:pl-14">
		<main class="flex-1 p-6">
			{@render children?.()}
		</main>
	</div>
</div>
