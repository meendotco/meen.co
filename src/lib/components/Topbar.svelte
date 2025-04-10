<script lang="ts">
	import { LogOut, User } from 'lucide-svelte';

	import { Button } from '@/components/ui/button';
	import * as DropdownMenu from '@/components/ui/dropdown-menu';
	import { page } from '$app/state';

	import Logo from './Logo.svelte';
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

			{#if user}
				<!-- User dropdown with glow effect -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button
							builders={[builder]}
							variant="ghost"
							size="icon"
							class="group relative rounded-full"
						>
							<div
								class="absolute -inset-1 rounded-full bg-primary/20 opacity-0 blur-sm transition-opacity group-hover:opacity-100"
							></div>
							<div
								class="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/20"
							>
								<User class="h-4 w-4 text-primary" strokeWidth={1.5} />
							</div>
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						class="w-56 border border-white/10 bg-background/95 backdrop-blur-lg"
					>
						<DropdownMenu.Label>My Profile</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<div class="px-2 py-1.5 text-sm">
							<p class="truncate text-muted-foreground">
								{user?.email || 'No email'}
							</p>
						</div>
						<DropdownMenu.Separator />
						<DropdownMenu.Item class="cursor-pointer text-destructive focus:text-destructive">
							<LogOut class="mr-2 h-4 w-4" />
							<span>Log out</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}
		</div>
	</div>
</header>
