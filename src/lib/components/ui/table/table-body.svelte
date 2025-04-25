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

<tbody 
	bind:this={ref} 
	class={cn(
		"[&_tr:last-child]:border-0 [&_tr]:animate-in [&_tr]:fade-in [&_tr]:slide-in-from-bottom-2 [&_tr]:duration-300 [&_tr]:fill-mode-forwards [&_tr:nth-child(1)]:delay-0 [&_tr:nth-child(2)]:delay-100 [&_tr:nth-child(3)]:delay-200 [&_tr:nth-child(4)]:delay-300 [&_tr:nth-child(5)]:delay-400", 
		className
	)} 
	{...restProps}
>
	{@render children?.()}
</tbody>
