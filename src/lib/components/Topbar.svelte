<script lang="ts">
	import { LogOut, User } from 'lucide-svelte';

	import { Button } from '@/components/ui/button';
	import { page } from '$app/state';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	import Logo from './Logo.svelte';
	import UserMenu from './UserMenu.svelte';
	let { user } = $props();
</script>

<header class="sticky top-0 z-50 flex w-full justify-center py-4 backdrop-blur-lg">
	<div
		class="flex w-[95%] max-w-5xl items-center justify-between rounded-full border border-white/10 bg-background/80 px-4 py-2 shadow-lg supports-[backdrop-filter]:bg-background/60"
	>
		<Logo />

		<div class="flex items-center space-x-4">
			<nav class="flex items-center space-x-4">
				{#if user}
					<a
						href="/dashboard"
						class="{page.url.pathname.startsWith('/dashboard')
							? 'text-primary'
							: 'text-foreground/70'} transition-colors hover:text-primary"
					>
						Dashboard
					</a>
				{:else}
					<a href="/signin" class="text-foreground/70 transition-colors hover:text-primary">
						Sign In
					</a>
				{/if}
			</nav>

			<UserMenu {user} />
		</div>
	</div>
</header>
