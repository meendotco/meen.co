<script lang="ts">
	import '../app.css';

	import { ModeWatcher } from 'mode-watcher';

	import { page } from '$app/state';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	let { data, children } = $props();
</script>

<ModeWatcher />
<Toaster />
<ErrorBoundary />
<div class="min-h-screen bg-background">
	{#if (page.url.pathname.startsWith('/') || page.url.pathname.startsWith('/about')) && !page.route?.id?.startsWith('/[org]') && !page.route?.id?.startsWith('/dashboard')}
		<Topbar user={data.user} />
	{/if}
	{@render children?.()}
	{#if page.url.pathname === '/'}
		<div
			class="absolute inset-0 mt-[-2px] h-full bg-[linear-gradient(to_right,rgba(23,23,23,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,23,23,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] dark:bg-[linear-gradient(to_right,rgba(23,23,23,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,23,23,0.6)_1px,transparent_1px)]"
		></div>
	{/if}
</div>

{#if !page.url.pathname.startsWith('/dashboard')}
	<footer
		class="w-full border-t border-border bg-card/40 pb-8 backdrop-blur-sm dark:border-white/10 dark:bg-black/40"
	>
		<div class="mx-auto max-w-screen-lg px-4">
			<div class="grid grid-cols-1 gap-8 pt-8 md:grid-cols-4">
				<div class="md:col-span-1">
					<div class="flex items-center space-x-2">
						<Logo />
						<span class="font-semibold">Meen</span>
					</div>
					<p class="mt-2 text-sm text-foreground/70 dark:text-white/70">
						Empowering the future through intelligent solutions.
					</p>
				</div>

				<div>
					<h4 class="mb-3 font-medium text-foreground dark:text-white">Company</h4>
					<ul class="space-y-2 text-sm">
						<li>
							<a
								href="mailto:hello@meen.ai"
								class="text-foreground/70 transition-colors hover:text-primary dark:text-white/70 dark:hover:text-primary"
								>Contact us</a
							>
						</li>
					</ul>
				</div>

				<div>
					<h4 class="mb-3 font-medium text-foreground dark:text-white">Resources</h4>
					<ul class="space-y-2 text-sm">
						<li>
							<a
								href="/privacy"
								class="text-foreground/70 transition-colors hover:text-primary dark:text-white/70 dark:hover:text-primary"
								>Privacy policy</a
							>
						</li>
						<li>
							<a
								href="/terms"
								class="text-foreground/70 transition-colors hover:text-primary dark:text-white/70 dark:hover:text-primary"
								>Terms of service</a
							>
						</li>
					</ul>
				</div>
			</div>

			<div
				class="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-foreground/70 dark:border-white/10 dark:text-white/70 md:flex-row"
			>
				<div>
					&copy; {new Date().getFullYear()} Meen. All rights reserved.
				</div>
			</div>
		</div>
	</footer>
{/if}
