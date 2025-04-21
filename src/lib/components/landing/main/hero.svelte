<script lang="ts">
	import BlurText from '$lib/components/landing/blur-text.svelte';
	import Container from '$lib/components/landing/container.svelte';
</script>

<div
	class="relative z-40 mx-auto mb-0 mt-24 flex w-full max-w-5xl flex-col items-center pb-8 text-center md:pb-8 lg:pb-8"
>
	<Container delay={0.0}>
		<div
			class="mx-auto flex w-max cursor-pointer select-none items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 py-1 pl-2 pr-1 backdrop-blur-lg hover:border-primary/30"
		>
			<div class="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary/40">
				<div
					class="flex h-2.5 w-2.5 animate-ping items-center justify-center rounded-full bg-primary/60"
				>
					<div
						class="flex h-2.5 w-2.5 animate-ping items-center justify-center rounded-full bg-primary/60"
					></div>
				</div>
				<div
					class="absolute left-1/2 top-1/2 flex h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary"
				></div>
			</div>
			<span
				class="animate-text-gradient inline-flex animate-background-shine items-center justify-center gap-2 bg-gradient-to-r from-primary/90 via-primary to-primary/70 bg-[200%_auto] bg-clip-text text-sm text-transparent"
			>
				Build Mode
				<span
					class="flex items-center justify-center rounded-full bg-gradient-to-b from-foreground/20 to-foreground/10 px-1.5 py-0.5 text-xs text-secondary-foreground"
				>
					{new Date().getTime() - new Date('2025-04-08').getTime() > 0
						? `${Math.floor((new Date().getTime() - new Date('2025-04-08').getTime()) / (1000 * 60 * 60 * 24))}d`
						: 'New'}
				</span>
			</span>
		</div>
	</Container>
	<BlurText
		word="Find the Right Fit in Seconds"
		className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent py-2 md:py-0 lg:!leading-snug font-medium racking-[-0.0125em] mt-6 font-heading"
	/>
	<p class="mx-auto mt-4 max-w-2xl text-lg text-foreground/70">
		Elevate your hiring with AI-powered sourcing and screening. Meen is your all-in-one talent
		acquisition solution.
	</p>
</div>
