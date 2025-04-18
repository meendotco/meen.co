<script lang="ts">
	import { page } from '$app/state';

	const status = $derived(page.status);
	const error = $derived(page.error);
</script>

<div class="flex min-h-screen flex-col items-center justify-center p-4 text-center">
	<h1 class="mb-2 text-8xl font-extrabold text-primary">{status}</h1>
	<h2 class="mb-4 text-2xl font-semibold text-foreground">Oops! Something went wrong.</h2>

	{#if error?.message}
		<p class="mb-8 max-w-md text-muted-foreground">{error.message}</p>
	{/if}

	<div class="flex space-x-4">
		<button
			onclick={() => history.back()}
			class="rounded-md bg-secondary px-4 py-2 font-medium text-secondary-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
		>
			Go Back
		</button>
		<a
			href="/"
			class="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
		>
			Go Home
		</a>
	</div>
</div>
