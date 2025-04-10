<script lang="ts">
	import '../app.css';

	import { page } from '$app/state';
	import Topbar from '$lib/components/Topbar.svelte';

	let { data, children } = $props();

	import { ModeWatcher } from 'mode-watcher';
</script>

<ModeWatcher />

<div class="min-h-screen bg-background">
	{#if !page.url.pathname.startsWith('/dashboard')}
		<Topbar user={data.user} />
	{/if}
	{@render children?.()}
</div>

<footer class="w-full border-t border-white/10 bg-black/40 pb-8 backdrop-blur-sm">
	<div class="mx-auto max-w-screen-lg px-4">
		<div class="grid grid-cols-1 gap-8 pt-8 md:grid-cols-3">
			<div>
				<div class="flex items-center space-x-2">
					<div class="relative">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
							<span class="text-lg font-bold text-primary-foreground">M</span>
						</div>
					</div>
					<span
						class="bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text font-bold text-transparent"
						>Meen AI</span
					>
				</div>
				<p class="mt-2 text-sm text-white/70">
					Empowering the future through intelligent solutions.
				</p>
			</div>

			<div>
				<h4 class="mb-3 font-medium text-white">Company</h4>
				<ul class="space-y-2 text-sm">
					<li><a href="/about" class="text-white/70 hover:text-primary">About</a></li>
					<li><a href="/contact" class="text-white/70 hover:text-primary">Contact us</a></li>
				</ul>
			</div>

			<div>
				<h4 class="mb-3 font-medium text-white">Resources</h4>
				<ul class="space-y-2 text-sm">
					<li><a href="/privacy" class="text-white/70 hover:text-primary">Privacy policy</a></li>
				</ul>
			</div>
		</div>

		<div class="mt-8 border-t border-white/10 pt-8 text-center text-sm text-white/70">
			&copy; 2024 Meen AI. All rights reserved.
		</div>
	</div>
</footer>
