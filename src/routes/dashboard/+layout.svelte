<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		Breadcrumb,
		BreadcrumbItem,
		BreadcrumbLink,
		BreadcrumbList,
		BreadcrumbPage,
		BreadcrumbSeparator
	} from '$lib/components/ui/breadcrumb';

	let { data, children } = $props();
	let sidebarCollapsed = $state(false);

	function getCookie(name: string) {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) return parts.pop()?.split(';').shift();
		return undefined;
	}

	function setSidebarState(collapsed: boolean) {
		sidebarCollapsed = collapsed;
		document.cookie = `PaneForge:collapsed=${collapsed}; path=/; max-age=31536000; SameSite=Strict`;
	}

	function handleSidebarCollapse(event) {
		const isCollapsed = event.detail;
		setSidebarState(isCollapsed);
	}

	onMount(() => {
		// Check if the cookie exists and set the sidebar state accordingly
		const collapsedState = getCookie('PaneForge:collapsed');
		if (collapsedState !== undefined) {
			sidebarCollapsed = collapsedState === 'true';
		} else {
			// Cookie doesn't exist, set the default to false
			sidebarCollapsed = false;
		}
	});

	$effect(() => {
		// Force reactivity with $page
		$page;
		// Update the sidebar collapsed state when the page changes
	});

	// Generate breadcrumb items based on the current route
	function getBreadcrumbs() {
		const path = $page.url.pathname;
		const segments = path.split('/').filter(Boolean);

		// Always include Dashboard as the first item
		const breadcrumbs = [{ label: 'Dashboard', href: '/dashboard', active: segments.length === 1 }];

		// Add additional segments
		let currentPath = '/dashboard';
		for (let i = 1; i < segments.length; i++) {
			currentPath += `/${segments[i]}`;
			const isLast = i === segments.length - 1;
			breadcrumbs.push({
				label: segments[i].charAt(0).toUpperCase() + segments[i].slice(1).replace(/-/g, ' '),
				href: currentPath,
				active: isLast
			});
			if (segments[i] === 'jobs') break;
		}

		return breadcrumbs;
	}
</script>

<div class="flex min-h-screen bg-background">
	<Sidebar user={data.user} isCollapsed={sidebarCollapsed} on:collapse={handleSidebarCollapse} />
	<div class="flex-1 transition-all duration-300 {sidebarCollapsed ? 'ml-[80px]' : 'ml-[240px]'} ">
		<main class="flex-1 p-6">
			<div class="mb-6 flex items-center space-x-1 px-1 py-3">
				<Breadcrumb>
					<BreadcrumbList class="flex items-center space-x-1 text-sm font-medium">
						{#each getBreadcrumbs() as crumb, i}
							<BreadcrumbItem class="flex items-center">
								{#if crumb.active}
									<BreadcrumbPage class="font-semibold text-foreground/70"
										>{crumb.label}</BreadcrumbPage
									>
								{:else}
									<BreadcrumbLink
										href={crumb.href}
										class="text-muted-foreground transition-colors hover:text-primary"
										>{crumb.label}</BreadcrumbLink
									>
								{/if}
							</BreadcrumbItem>
							{#if i < getBreadcrumbs().length - 1}
								<BreadcrumbSeparator class="text-muted-foreground/50" />
							{/if}
						{/each}
					</BreadcrumbList>
				</Breadcrumb>
			</div>
			{@render children?.()}
		</main>
	</div>
</div>
