<script lang="ts">
	import type { HTMLTdAttributes } from "svelte/elements";
	import type { WithElementRef } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import { fade } from "svelte/transition";

	let {
		ref = $bindable(null),
		class: className,
		children,
		isUpdating,
		...restProps
	}: WithElementRef<HTMLTdAttributes> = $props();

	let isLoading = $state(isUpdating);
	
	$effect(() => {
		if (children && !isUpdating) {
			isLoading = true;
			const timer = setTimeout(() => {
				isLoading = false;
			}, 1000);
			
			return () => clearTimeout(timer);
		}
	});
</script>
<td
	bind:this={ref}
	class={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
	{...restProps}
>
	{#if isLoading}
		<div class="animate-pulse h-4 w-[200px] bg-muted rounded"></div>
	{:else}
		<div in:fade={{ duration: 200 }} class="max-w-[200px] truncate">
			{@render children?.()}
		</div>
	{/if}
</td>
