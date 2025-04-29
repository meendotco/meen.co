<script lang="ts">
	import type { HTMLTdAttributes } from "svelte/elements";
	import type { WithElementRef } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import { fade } from "svelte/transition";
	import * as Popover from "$lib/components/ui/popover";

	let {
		ref = $bindable(null),
		class: className,
		children,
		isUpdating,
		...restProps
	}: WithElementRef<HTMLTdAttributes> = $props();

	let isLoading = $state(isUpdating);
	let contentRef = $state<HTMLElement | null>(null);
	let isOverflowing = $state(false);
	let content = $state('');
	
	$effect(() => {
		if (children && !isUpdating) {
			isLoading = true;
			const timer = setTimeout(() => {
				isLoading = false;
			}, 1000);
			
			return () => clearTimeout(timer);
		}
	});

	$effect(() => {
		if (contentRef) {
			isOverflowing = contentRef.scrollWidth > contentRef.clientWidth;
			content = contentRef.textContent || '';
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
		{#if isOverflowing}
			<Popover.Root>
				<Popover.Trigger>
					<div 
						bind:this={contentRef}
						in:fade={{ duration: 200 }} 
						class="max-w-[200px] truncate cursor-pointer hover:text-primary"
					>
						{@render children?.()}
					</div>
				</Popover.Trigger>
				<Popover.Content class="w-[300px] max-h-[200px] overflow-y-auto p-4">
					<div class="whitespace-pre-wrap break-words">
						{content}
					</div>
				</Popover.Content>
			</Popover.Root>
		{:else}
			<div 
				bind:this={contentRef}
				in:fade={{ duration: 200 }} 
				class="max-w-[200px] truncate"
			>
				{@render children?.()}
			</div>
		{/if}
	{/if}
</td>