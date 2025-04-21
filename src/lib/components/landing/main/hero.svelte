<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';

	import BlurText from '$lib/components/landing/blur-text.svelte';
	import Container from '$lib/components/landing/container.svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<div
	class="md:pb-18 lg:pb-26 relative z-40 mx-auto mb-0 mt-24 flex w-full max-w-5xl flex-col items-center pb-14 text-center"
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
				Build for the future
				<span
					class="flex items-center justify-center rounded-full bg-gradient-to-b from-foreground/20 to-foreground/10 px-1.5 py-0.5 text-xs text-secondary-foreground"
				>
					What&apos;s new
					<ArrowRight class="ml-1 h-3.5 w-3.5 text-foreground/50" />
				</span>
			</span>
		</div>
	</Container>
	<BlurText
		word="Find the Right Fit in Seconds"
		className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent py-2 md:py-0 lg:!leading-snug font-medium racking-[-0.0125em] mt-6 font-heading"
	/>
	<Container delay={0.1}>
		<p
			class="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base lg:text-lg"
		>
			Elevate your hiring with AI-powered sourcing and screening. <span class="hidden sm:inline"
				>Meen is your all-in-one talent acquisition solution.</span
			>
		</p>
	</Container>
	<Container delay={0.2}>
		<div class="mt-8 flex items-center justify-center md:gap-x-6">
			<Button
				asChild
				size="lg"
				class="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent hover:scale-105 hover:from-primary/90 hover:to-primary hover:shadow-lg"
			>
				<a href="/signin"> Get Started </a>
			</Button>
		</div>
	</Container>
</div>
