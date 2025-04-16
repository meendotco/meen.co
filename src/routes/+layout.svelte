<script lang="ts">
	import '../app.css';

	import { page } from '$app/state';
	import Topbar from '$lib/components/Topbar.svelte';
	import { Github, Twitter, Linkedin, Mail, Heart } from 'lucide-svelte';
	let { data, children } = $props();

	import { ModeWatcher } from 'mode-watcher';
</script>

<ModeWatcher />

<div class="min-h-screen bg-background">
	{#if !page.url.pathname.startsWith('/dashboard')}
		<Topbar user={data.user} />
	{/if}
	{@render children?.()}
	{#if page.url.pathname === '/'}
		<div
			class="absolute inset-0 mt-[-2px] h-full bg-[linear-gradient(to_right,rgba(23,23,23,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,23,23,0.4)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"
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
					<p class="mt-2 text-sm text-foreground/70 dark:text-white/70">
						Empowering the future through intelligent solutions.
					</p>
					
					<div class="mt-4 flex items-center space-x-3">
						<a href="https://github.com" aria-label="GitHub" class="text-foreground/60 hover:text-primary transition-colors dark:text-white/60 dark:hover:text-primary">
							<Github size={18} />
						</a>
						<a href="https://twitter.com" aria-label="Twitter" class="text-foreground/60 hover:text-primary transition-colors dark:text-white/60 dark:hover:text-primary">
							<Twitter size={18} />
						</a>
						<a href="https://linkedin.com" aria-label="LinkedIn" class="text-foreground/60 hover:text-primary transition-colors dark:text-white/60 dark:hover:text-primary">
							<Linkedin size={18} />
						</a>
					</div>
				</div>

				<div>
					<h4 class="mb-3 font-medium text-foreground dark:text-white">Company</h4>
					<ul class="space-y-2 text-sm">
						<li>
							<a href="/about" class="text-foreground/70 hover:text-primary transition-colors dark:text-white/70 dark:hover:text-primary"
								>About</a
							>
						</li>
						<li>
							<a href="/contact" class="text-foreground/70 hover:text-primary transition-colors dark:text-white/70 dark:hover:text-primary"
								>Contact us</a
							>
						</li>
						<li>
							<a href="/careers" class="text-foreground/70 hover:text-primary transition-colors dark:text-white/70 dark:hover:text-primary"
								>Careers</a
							>
						</li>
					</ul>
				</div>

				<div>
					<h4 class="mb-3 font-medium text-foreground dark:text-white">Resources</h4>
					<ul class="space-y-2 text-sm">
						<li>
							<a href="/blog" class="text-foreground/70 hover:text-primary transition-colors dark:text-white/70 dark:hover:text-primary"
								>Blog</a
							>
						</li>
						<li>
							<a href="/documentation" class="text-foreground/70 hover:text-primary transition-colors dark:text-white/70 dark:hover:text-primary"
								>Documentation</a
							>
						</li>
						<li>
							<a href="/privacy" class="text-foreground/70 hover:text-primary transition-colors dark:text-white/70 dark:hover:text-primary"
								>Privacy policy</a
							>
						</li>
						<li>
							<a href="/terms" class="text-foreground/70 hover:text-primary transition-colors dark:text-white/70 dark:hover:text-primary"
								>Terms of service</a
							>
						</li>
					</ul>
				</div>

				<div>
					<h4 class="mb-3 font-medium text-foreground dark:text-white">Get in touch</h4>
					<p class="text-sm text-foreground/70 dark:text-white/70 mb-3">
						Subscribe to our newsletter for updates
					</p>
					<form class="flex flex-col space-y-2">
						<input 
							type="email" 
							placeholder="Enter your email" 
							class="rounded-md bg-background text-sm p-2 border border-border dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-primary"
						/>
						<button 
							type="submit" 
							class="rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium py-2 transition-colors"
						>
							Subscribe
						</button>
					</form>
				</div>
			</div>

			<div class="mt-8 pt-8 border-t border-border dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-foreground/70 dark:text-white/70">
				<div>
					&copy; {new Date().getFullYear()} Meen AI. All rights reserved.
				</div>
				<div class="flex items-center">
					<span>Made with</span>
					<Heart size={14} class="mx-1 text-destructive" />
					<span>by the Meen AI team</span>
				</div>
			</div>
		</div>
	</footer>
{/if}
