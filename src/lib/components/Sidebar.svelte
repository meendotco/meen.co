<script lang="ts">
	import {
		BriefcaseBusiness,
		ChevronLeft,
		ChevronRight,
		LayoutDashboard,
		Search,
		Settings
	} from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	import { page } from '$app/stores';
	import Logo from '$lib/components/Logo.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import UserMenu from '$lib/components/UserMenu.svelte';
	import { cn } from '$lib/utils';

	let { isCollapsed = $bindable(false), user } = $props();
	const dispatch = createEventDispatcher();

	const routes = [
		{
			href: '/dashboard',
			icon: LayoutDashboard,
			title: 'Dashboard',
			label: 'Home'
		},
		{
			href: '/dashboard/jobs',
			icon: BriefcaseBusiness,
			title: 'Jobs'
		},
		{
			href: '/dashboard/candidates',
			icon: Search,
			title: 'Candidates'
		},
		{
			href: '/dashboard/settings',
			icon: Settings,
			title: 'Settings'
		}
	];

	function toggleSidebar() {
		isCollapsed = !isCollapsed;
		dispatch('collapse', isCollapsed);
	}
</script>

<aside class="fixed inset-y-0 left-0 z-40 hidden transition-all duration-200 md:block">
	<div
		data-collapsed={isCollapsed}
		class="relative flex h-full flex-col gap-2 border-r border-border bg-background/80 shadow-md backdrop-blur-lg transition-all duration-300"
		class:w-[240px]={!isCollapsed}
		class:w-[80px]={isCollapsed}
	>
		<!-- Logo and Header -->
		<div class="flex h-16 items-center justify-between border-b border-border px-4">
			<div class="flex items-center gap-2">
				<Logo className={isCollapsed ? 'transition-all duration-200 ml-2' : ''} />
				{#if !isCollapsed}
					<span
						class="ml-1 bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text text-lg font-semibold text-transparent"
						>Meen</span
					>

					{#if user?.organizationHandle}
						<Badge>{user?.organizationHandle}</Badge>
					{:else}
						<Badge variant="secondary" class="justify-center text-xs">no org</Badge>
					{/if}
				{/if}
			</div>
		</div>

		<!-- Navigation -->
		<nav class="flex flex-1 flex-col gap-2 p-4">
			{#each routes as route}
				<a
					href={route.href}
					class={cn(
						'flex h-10 items-center gap-3 rounded-md px-3 transition-colors',
						$page.url.pathname === route.href
							? 'bg-primary text-primary-foreground'
							: 'text-foreground/70 hover:text-primary dark:text-white/70 dark:hover:text-primary'
					)}
				>
					<svelte:component this={route.icon} class="h-5 w-5" />
					{#if !isCollapsed}
						<span>{route.title}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<!-- User Menu -->
		<div class="border-t border-border p-4">
			<div class="flex flex-col gap-2">
				<UserMenu {user} {isCollapsed} />
			</div>
		</div>

		<!-- Tongue-style Collapse Button -->
		<button
			type="button"
			class="absolute -right-4 top-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-background/80 shadow-md backdrop-blur-lg transition-all hover:bg-muted"
			onclick={toggleSidebar}
			aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			{#if isCollapsed}
				<ChevronRight class="h-4 w-4" />
			{:else}
				<ChevronLeft class="h-4 w-4" />
			{/if}
		</button>
	</div>
</aside>
