<script lang="ts">
	import { cn } from '$lib/utils';

	export let word: string = '';
	export let className = '';
	export let duration = 1;

	// Prepare the content for rendering
	$: lines = typeof word === 'string' ? word.split('\n') : [word];

	// Custom transition that combines blur and movement
	function blurAndFly(node: HTMLElement, { duration }: { duration: number }) {
		return {
			duration: duration * 1000,
			css: (t: number) => {
				const blur = 10 * (1 - t);
				const y = -20 * (1 - t);
				return `
					filter: blur(${blur}px);
					transform: translateY(${y}px);
					opacity: ${t}
				`;
			}
		};
	}
</script>

<h1
	in:blurAndFly={{ duration }}
	class={cn(className, 'text-center tracking-[-0.02em] drop-shadow-sm')}
>
	{#if typeof word === 'string'}
		{#each lines as line, index (index)}
			<span>
				{line}
				{#if index < lines.length - 1}
					<br class="hidden md:block" />
				{/if}
			</span>
		{/each}
	{:else}
		{word}
	{/if}
</h1>
