<script lang="ts">
	import { Button } from '@/components/ui/button';
	import { page } from '$app/state';
	import { Github, Twitter, Linkedin } from 'lucide-svelte';

	import Logo from './Logo.svelte';
	import UserMenu from './UserMenu.svelte';
	let { user } = $props();

	let scrollY = $state(0);

	$effect(() => {
		const handleScroll = () => {
			scrollY = window.scrollY;
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	const showTopbar = $derived(scrollY > 100 || user?.email);
</script>

<header
	class="sticky top-0 z-50 flex w-full justify-center py-4 backdrop-blur-lg transition-all duration-300"
	class:opacity-0={!showTopbar}
	class:opacity-100={showTopbar}
>
	<div
		class="flex w-[95%] max-w-5xl items-center justify-between rounded-full border border-border bg-background/80 px-4 py-2 shadow-lg supports-[backdrop-filter]:bg-background/60 dark:border-white/10 dark:bg-black/60"
	>
		<div class="flex items-center space-x-2">
			<Logo />
			<span
				class="hidden bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text font-bold text-transparent sm:inline-block"
				>Meen AI</span
			>
		</div>

		<div class="flex items-center space-x-1 md:space-x-4">
			<nav class="hidden items-center md:flex">
				<a
					href="/about"
					class="px-3 py-2 text-sm text-foreground/70 transition-colors hover:text-primary dark:text-white/70 dark:hover:text-primary"
				>
					About
				</a>
				<a
					href="/blog"
					class="px-3 py-2 text-sm text-foreground/70 transition-colors hover:text-primary dark:text-white/70 dark:hover:text-primary"
				>
					Blog
				</a>
				<a
					href="/documentation"
					class="px-3 py-2 text-sm text-foreground/70 transition-colors hover:text-primary dark:text-white/70 dark:hover:text-primary"
				>
					Docs
				</a>
				<a
					href="/contact"
					class="px-3 py-2 text-sm text-foreground/70 transition-colors hover:text-primary dark:text-white/70 dark:hover:text-primary"
				>
					Contact
				</a>
			</nav>

			<div class="hidden items-center space-x-2 md:flex">
				<a href="https://github.com" aria-label="GitHub" class="text-foreground/60 transition-colors hover:text-primary dark:text-white/60 dark:hover:text-primary">
					<Github size={18} />
				</a>
				<a href="https://twitter.com" aria-label="Twitter" class="text-foreground/60 transition-colors hover:text-primary dark:text-white/60 dark:hover:text-primary">
					<Twitter size={18} />
				</a>
				<a href="https://linkedin.com" aria-label="LinkedIn" class="text-foreground/60 transition-colors hover:text-primary dark:text-white/60 dark:hover:text-primary">
					<Linkedin size={18} />
				</a>
			</div>

			<div class="flex items-center space-x-2">
				{#if user}
					<a
						href="/dashboard"
						class="px-3 py-2 text-sm font-medium {page.url.pathname.startsWith('/dashboard')
							? 'text-primary'
							: 'text-foreground/70'} transition-colors hover:text-primary dark:hover:text-primary"
					>
						Dashboard
					</a>
				{:else}
					<Button
						variant="ghost"
						href="/signin"
						class="text-sm text-foreground/70 transition-colors hover:text-primary dark:text-white/70 dark:hover:text-primary"
					>
						Sign In
					</Button>
					<Button
						variant="default"
						href="/signup"
						class="rounded-full bg-primary text-sm text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
					>
						Get Started
					</Button>
				{/if}
			</div>

			<UserMenu {user} />
		</div>
	</div>
</header>

<style>
	/* Add responsive styles for smaller screens if needed */
	@media (max-width: 768px) {
		nav {
			display: none;
		}
	}
</style>
