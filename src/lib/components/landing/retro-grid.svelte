<script lang="ts">
	import { cn } from '$lib/utils';

	let { className = '', angle = 65 } = $props();
</script>

<div
	class={cn(
		'pointer-events-none absolute size-full overflow-hidden opacity-50 [perspective:200px]',
		className
	)}
>
	<div
		class={cn(
			'pointer-events-none absolute size-full overflow-hidden opacity-50 [perspective:200px]',
			className
		)}
		style="--grid-angle: {angle}deg"
	>
		<div class="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
			<div
				class={cn(
					'animate-grid',

					'[background-repeat:repeat] [background-size:60px_60px] [height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]',

					// Grid lines that work in both light and dark modes
					'dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.3)_1px,transparent_0),linear-gradient(to_bottom,rgba(255,255,255,0.3)_1px,transparent_0)]',
					'[background-image:linear-gradient(to_right,rgba(0,0,0,0.3)_1px,transparent_0),linear-gradient(to_bottom,rgba(0,0,0,0.3)_1px,transparent_0)]'
				)}
			></div>
		</div>

		<div class="absolute inset-0 bg-gradient-to-t from-background to-transparent to-90%"></div>
	</div>
</div>
