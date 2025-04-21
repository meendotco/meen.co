<script lang="ts">
	import { ChartBar, Clipboard, Search } from '@lucide/svelte';

	import Container from '$lib/components/landing/container.svelte';
	import SectionBadge from '$lib/components/landing/section-badge.svelte';
	import { cn } from '$lib/utils';

	const PERKS = [
		{
			id: 'search',
			icon: Search,
			title: 'AI-Powered Search',
			description:
				'Natural language search that understands context and intent to find the perfect candidates'
		},
		{
			id: 'ranking',
			icon: ChartBar,
			title: 'Smart Ranking',
			description:
				'Automatically rank and score candidates based on your specific requirements and criteria'
		},
		{
			id: 'integration',
			icon: Clipboard,
			title: 'Simple Integration',
			description:
				'Seamlessly integrate your existing job posts with Meen to find the perfect candidates'
		}
	];
</script>

<div id="features" class="flex w-full flex-col items-center justify-center py-12 md:py-16 lg:py-24">
	<Container>
		<div class="mx-auto flex max-w-2xl flex-col items-center text-center">
			<SectionBadge title="Features" />
			<h2 class="font-heading mt-6 text-2xl font-medium !leading-snug md:text-4xl lg:text-5xl">
				Discover the benefits
			</h2>
			<p class="mt-6 text-center text-base text-muted-foreground md:text-lg"></p>
		</div>
	</Container>
	<Container>
		<div class="mt-16 w-full">
			<div
				class="relative grid w-full grid-cols-1 rounded-lg bg-background shadow-sm md:grid-cols-2 lg:grid-cols-3"
			>
				{#each PERKS as perk, index (perk.id)}
					<div
						class={cn(
							'group/feature relative flex transform-gpu flex-col border-border py-10 transition-all duration-300 hover:bg-secondary/30',
							(index === 0 || index === 3) && 'lg:border-l',
							index < 3 && 'lg:border-b',
							'lg:border-r'
						)}
					>
						{#if index < 3}
							<!-- svelte-ignore element_invalid_self_closing_tag -->
							<div
								class="pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-t from-primary/25 to-transparent opacity-0 transition duration-300 group-hover/feature:opacity-100"
							/>
						{:else}
							<!-- svelte-ignore element_invalid_self_closing_tag -->
							<div
								class="pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-b from-primary/25 to-transparent opacity-0 transition duration-300 group-hover/feature:opacity-100"
							/>
						{/if}
						<div
							class="flex w-full transform-gpu flex-col transition-all duration-300 group-hover/feature:-translate-y-1"
						>
							<div class="relative z-10 mb-4 px-10">
								<div class="inline-block rounded-lg bg-primary/10 p-2.5">
									<svelte:component
										this={perk.icon}
										strokeWidth={1.5}
										class="h-8 w-8 origin-left transform-gpu text-primary transition-all duration-300 ease-in-out group-hover/feature:scale-110"
									/>
								</div>
							</div>
							<div class="font-heading relative z-10 mb-2 px-10 text-lg font-medium">
								<!-- svelte-ignore element_invalid_self_closing_tag -->
								<div
									class="absolute -inset-y-0 left-0 h-6 w-1.5 origin-center rounded-br-full rounded-tr-full bg-primary/30 transition-all duration-500 group-hover/feature:h-8 group-hover/feature:bg-primary"
								/>
								<span
									class="heading inline-block transition duration-500 group-hover/feature:text-foreground/90"
								>
									{perk.title}
								</span>
							</div>
							<p
								class="relative z-10 max-w-xs px-10 text-sm text-foreground/70 group-hover/feature:text-foreground/90"
							>
								{perk.description}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</Container>
</div>
