<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLTableSectionElement>> = $props();
</script>

<thead 
	bind:this={ref} 
	class={cn(
		"[&_tr]:border-b animate-in fade-in slide-in-from-top-2 duration-300", 
		className
	)} 
	{...restProps}
>
	{@render children?.()}
</thead>
