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
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';

	let success = $state(false);
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

	let subject = $state('');
	let message = $state('');

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

	async function requestAccess() {
		const response = await fetch('/api/request-access', {
			method: 'POST',
			body: JSON.stringify({
				companyName: subject,
				message: message
			})
		});

		if (response.ok) {
			success = true;
		} else {
			success = false;
		}
	}
</script>

{#if data?.user && data?.user.organizationHandle}
	<div class="flex min-h-screen bg-background">
		<Sidebar user={data.user} isCollapsed={sidebarCollapsed} on:collapse={handleSidebarCollapse} />
		<div
			class="flex-1 transition-all duration-300 {sidebarCollapsed ? 'ml-[80px]' : 'ml-[240px]'} "
		>
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
{:else if data?.user && !data.user.organizationHandle}
	{#if !success}
		<div class="flex min-h-screen bg-background">
			<div class="flex-1 transition-all duration-300">
				<main class="flex-1 p-6">
					<div class="mx-auto mt-12 flex max-w-md flex-col items-center justify-center space-y-6">
						<h1 class="text-center text-2xl font-bold">No Organization</h1>
						<p class="text-center text-muted-foreground">
							Looks like you're not part of an organization🤦‍♂️
						</p>

						<div class="w-full rounded-lg border bg-card p-6 shadow-sm">
							<h2 class="mb-4 text-xl font-semibold">Request access to Meen</h2>

							<div class="space-y-2">
								<p class="text-sm font-medium">Company Name</p>
								<Input
									id="subject"
									type="text"
									bind:value={subject}
									class="w-full rounded-md border p-2"
									placeholder="Meen AI"
								/>
							</div>
							<div class="space-y-2">
								<p class="text-sm font-medium">Who are you?</p>
								<Textarea
									id="message"
									rows="4"
									bind:value={message}
									class="w-full rounded-md border p-2"
									placeholder="My name is Markus and I'm a recruiter at Meen AI."
								/>
							</div>
							<Button class="mt-2 w-full" onclick={requestAccess}>Send Request</Button>
						</div>
					</div>
				</main>
			</div>
		</div>
	{:else if success}
		<div class="flex min-h-screen bg-background">
			<div class="flex-1 transition-all duration-300">
				<main class="flex-1 p-6">
					<div class="flex flex-col items-center justify-center">
						<h1 class="text-2xl font-bold">Access request sent successfully</h1>
						<p class="text-muted-foreground">
							Your request has been sent to the admin. You will receive an email once it's approved.
						</p>
						<Button onclick={() => (window.location.href = '/')}>Go back Home</Button>
					</div>
				</main>
			</div>
		</div>
	{/if}
{:else}
	<div class="flex min-h-screen bg-background">
		<div class="flex-1 transition-all duration-300">
			<main class="flex-1 p-6">
				<div class="flex flex-col items-center justify-center">
					<h1 class="text-2xl font-bold">Loading...</h1>
				</div>
			</main>
		</div>
	</div>
{/if}
