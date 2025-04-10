<script lang="ts">
	import { BriefcaseBusiness, LogOut, Search, User } from '@lucide/svelte';

	import * as DropdownMenu from '@/components/ui/dropdown-menu';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';

	import Logo from './Logo.svelte';
	let { user } = $props();
</script>

<aside
	class="bg-sidebar-background fixed inset-y-0 left-0 z-30 hidden w-14 flex-col border-r border-white/10 bg-gradient-to-b from-background via-background to-background/90 px-2 lg:flex"
>
	<div class="mt-2">
		<Logo />
	</div>
	<nav class="flex flex-col items-center gap-4 pt-6">
		<a
			href="/dashboard/job-post/create"
			class="group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all {$page.url.pathname.startsWith(
				'/dashboard/job-post/create'
			)
				? 'bg-primary/20 text-primary'
				: 'text-sidebar-foreground hover:text-primary'}"
			aria-label="Create Job Post"
		>
			<div
				class="absolute -inset-1 rounded-lg bg-primary/20 opacity-0 blur-sm transition-opacity group-hover:opacity-100"
			></div>
			<BriefcaseBusiness class="relative z-10 h-5 w-5" />
		</a>
		<a
			href="/dashboard/candidates"
			class="group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all {$page.url.pathname.startsWith(
				'/dashboard/candidates'
			)
				? 'bg-primary/20 text-primary'
				: 'text-sidebar-foreground hover:text-primary'}"
			aria-label="Search Candidates"
		>
			<div
				class="absolute -inset-1 rounded-lg bg-primary/20 opacity-0 blur-sm transition-opacity group-hover:opacity-100"
			></div>
			<Search class="relative z-10 h-5 w-5" />
		</a>
	</nav>
	<div class="mt-auto pb-4">
		{#if user}
			<!-- User dropdown with glow effect -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<Button
						builders={[builder]}
						variant="ghost"
						size="icon"
						class="group relative h-10 w-10 rounded-full"
					>
						<div
							class="absolute -inset-1 rounded-full bg-primary/20 opacity-0 blur-sm transition-opacity group-hover:opacity-100"
						></div>
						<div
							class="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary/20"
						>
							<User class="h-4 w-4 text-primary" strokeWidth={1.5} />
						</div>
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content
					align="end"
					alignOffset={-40}
					side="right"
					sideOffset={10}
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
</aside>
