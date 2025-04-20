<script lang="ts">
	import Container from '$lib/components/landing/container.svelte';
	import SectionBadge from '$lib/components/landing/section-badge.svelte';
</script>

<Container delay={0.1} customClass="py-12 md:py-16 lg:py-24">
	<div class="mx-auto flex max-w-2xl flex-col items-center text-center">
		<SectionBadge title="What we solve for" />
		<h2 class="font-heading mt-6 text-2xl font-medium !leading-snug md:text-4xl lg:text-5xl">
			Efficiently identifying<br />best-fit solutions
		</h2>
		<p class="mt-6 text-center text-base text-accent-foreground/80 md:text-lg">
			Our intelligent platform helps you find the perfect solutions for your specific needs, whether
			you're handling inbound requests or conducting outbound searches
		</p>
	</div>
</Container>
<div class="grid gap-6 md:grid-cols-2">
	<!-- Inbound Card -->
	<div
		class="group/feature relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card/30 p-8 backdrop-blur-md dark:border-white/10 dark:bg-black/30"
	>
		<div
			class="from-neutral-80 pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-t from-violet-950/25 to-transparent opacity-0 transition duration-200 group-hover/feature:opacity-100"
		></div>
		<div
			class="relative z-10 transform-gpu transition-all duration-300 group-hover/feature:-translate-y-1"
		>
			<h3 class="mb-6 text-2xl font-semibold text-neutral-500 dark:text-white">For Inbound</h3>
			<p class="text-base text-neutral-300 dark:text-white/70">
				Connect your systems and immediately identify the most qualified solutions. Enrich your data
				with external sources and AI-powered insights.
			</p>
		</div>
	</div>

	<!-- Outbound Card -->
	<div
		class="group/feature relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card/30 p-8 backdrop-blur-md dark:border-white/10 dark:bg-black/30"
	>
		<div
			class="from-neutral-80 pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-t from-violet-950/25 to-transparent opacity-0 transition duration-200 group-hover/feature:opacity-100"
		></div>
		<div
			class="relative z-10 transform-gpu transition-all duration-300 group-hover/feature:-translate-y-1"
		>
			<h3 class="mb-6 text-2xl font-semibold text-violet-600 dark:text-purple-400">For Outbound</h3>
			<p class="text-base text-neutral-300 dark:text-white/70">
				Proactively search and identify potential solutions using our advanced AI technology and
				comprehensive database.
			</p>
		</div>
	</div>
</div>
