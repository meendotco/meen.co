<script lang="ts">
	import { goto } from '$app/navigation';
	import Container from '$lib/components/landing/container.svelte';
	import SectionBadge from '$lib/components/landing/section-badge.svelte';
	const candidates = [
		{
			name: 'Sarah Chen',
			position: 'Senior Product Manager at Stripe',
			image:
				'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop',
			match: 98
		},
		{
			name: 'Michael Ross',
			position: 'Product Manager at Salesforce',
			image:
				'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop',
			match: 95
		},
		{
			name: 'Emily Johnson',
			position: 'Senior Product Manager at Dropbox',
			image:
				'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&auto=format&fit=crop',
			match: 92
		}
	];

	function search() {
		scrollTo({
			top: document.getElementById('contact')?.offsetTop,
			behavior: 'smooth'
		});
	}
</script>

<div id="about" class="relative z-40 flex w-full flex-col items-center justify-center">
	<div class="mt-4 w-full">
		<div
			class="overflow-hidden rounded-xl border border-border bg-card/30 backdrop-blur-md dark:border-white/10 dark:bg-black/30"
		>
			<div class="p-6 md:p-10">
				<div class="relative mx-auto max-w-2xl">
					<div
						class="relative flex overflow-hidden rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm dark:border-transparent dark:bg-black/50"
					>
						<div class="flex flex-1 items-center">
							<svg
								class="ml-4 h-5 w-5 text-foreground/50 dark:text-white/50"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								></path>
							</svg>
							<input
								type="text"
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										search();
									}
								}}
								placeholder="Senior Product Manager with 5+ years SaaS exp"
								class="w-full flex-1 border-none bg-transparent px-4 py-3.5 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-0 dark:text-white dark:placeholder-white/50"
							/>
						</div>
						<button
							onclick={search}
							class="bg-primary px-6 py-3.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
						>
							Search
						</button>
					</div>
					<div class="mt-2 flex flex-wrap gap-2">
						<span class="rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary"
							>Product</span
						>
						<span class="rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary"
							>SaaS</span
						>
						<span class="rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary"
							>5+ years</span
						>
						<span class="rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary"
							>Remote</span
						>
					</div>
				</div>

				<div class="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
					{#each candidates as candidate (candidate.name)}
						<div
							class="group/feature relative flex transform-gpu cursor-pointer flex-col rounded-lg border border-border bg-card/10 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/5"
						>
							<div
								class="pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-t from-primary/25 to-transparent opacity-0 transition duration-200 group-hover/feature:opacity-100"
							/>
							<div
								class="relative z-10 flex transform-gpu items-center transition-all duration-300 group-hover/feature:-translate-y-1"
							>
								<div class="mr-4 h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
									<img
										src={candidate.image}
										alt={candidate.name}
										class="h-full w-full object-cover"
									/>
								</div>
								<div>
									<h3 class="font-semibold text-foreground dark:text-white">{candidate.name}</h3>
									<p class="text-sm text-foreground/70 dark:text-white/70">
										{candidate.position}
									</p>
									<div class="mt-1 flex items-center">
										<span
											class={`rounded px-1.5 py-0.5 text-xs ${candidate.match >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'}`}
										>
											{candidate.match}% match
										</span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<div class="mt-6 flex justify-center">
					<p
						class="flex items-center gap-1 font-medium text-primary transition-colors hover:text-primary/80"
					>
						From our candidate base
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
