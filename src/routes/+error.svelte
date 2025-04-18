<script lang="ts">
	import { page } from '$app/state';

	const status = $derived(page.status);
	const error = $derived(page.error);
</script>

<h1>{status}</h1>
<p>{error?.message}</p>
<button onclick={() => location.reload()}>Reload</button>
