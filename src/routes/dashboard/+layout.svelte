<script lang="ts">
	import { onMount } from 'svelte';

	import { page } from '$app/stores';
	import Sidebar from '$lib/components/Sidebar.svelte';
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

	onMount(() => {
		const collapsedState = getCookie('PaneForge:collapsed');
		sidebarCollapsed = collapsedState === 'true';
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

		const breadcrumbs = [{ label: 'Dashboard', href: '/dashboard', active: segments.length === 1 }];
		let currentPath = '/dashboard';
		for (let i = 1; i < segments.length; i++) {
			currentPath += `/${segments[i]}`;
			const isLast = i === segments.length - 1;
			breadcrumbs.push({
				label: segments[i].charAt(0).toUpperCase() + segments[i].slice(1).replace(/-/g, ' '),
				href: currentPath,
				active: isLast
			});
		}

		return breadcrumbs;
	}
</script>

<div class="flex min-h-screen bg-background">
	<Sidebar user={data.user} isCollapsed={sidebarCollapsed} />

	<div
		class="flex-1 transition-all duration-300"
		class:ml-[80px]={sidebarCollapsed}
		class:ml-[240px]={!sidebarCollapsed}
	>
		<main class="flex-1 p-6">
			<div class="mb-6 flex items-center space-x-1 px-1 py-3">
				<Breadcrumb>
					<BreadcrumbList class="flex items-center space-x-1 text-sm font-medium">
						{#each getBreadcrumbs() as crumb, i (crumb.href)}
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
