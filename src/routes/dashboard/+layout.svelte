<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
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

	function handleSidebarCollapse(event: CustomEvent<boolean>) {
		const isCollapsed = event.detail;
		setSidebarState(isCollapsed);
	}

	onMount(() => {
		const collapsedState = getCookie('PaneForge:collapsed');
		if (collapsedState !== undefined) {
			sidebarCollapsed = collapsedState === 'true';
		} else {
			sidebarCollapsed = false;
		}
	});

	let subject = $state('');
	let message = $state('');

	async function requestAccess() {
		const response = await fetch('/api/request-access', {
			method: 'POST',
			body: JSON.stringify({
				companyName: subject,
				message: message
			})
		});
		toast.success('Access request sent successfully');

		if (response.ok) {
			success = true;
		} else {
			success = false;
		}
	}
</script>

{#if data?.user && data?.user.organizationHandle}
	<div class="flex h-screen overflow-hidden bg-background">
		<Sidebar user={data.user} isCollapsed={sidebarCollapsed} on:collapse={handleSidebarCollapse} />
		<div
			class="flex-1 transition-all duration-300"
			style="margin-left: {sidebarCollapsed ? '80px' : '240px'};"
		>
			<div class="flex h-full flex-col">
				<div class="flex items-center space-x-1 px-6 py-3">
					<Breadcrumb.Root>
						<Breadcrumb.List class="flex items-center space-x-1 text-sm font-medium">
							{#each page.url.pathname.split('/') as crumb, i (crumb)}
								<Breadcrumb.Item class="flex items-center">
									<Breadcrumb.Page class="font-semibold text-foreground/70" href={`/${crumb}`}
										>{crumb}</Breadcrumb.Page
									>
								</Breadcrumb.Item>
								{#if i < page.url.pathname.split('/').length - 1}
									<Breadcrumb.Separator class="text-muted-foreground/50" />
								{/if}
							{/each}
						</Breadcrumb.List>
					</Breadcrumb.Root>
				</div>
				{@render children?.()}
			</div>
		</div>
	</div>
{:else if data?.user && !data.user.organizationHandle}
	{#if !success}
		<div class="flex h-screen overflow-hidden bg-background">
			<div class="flex-1 transition-all duration-300">
				<ScrollArea class="h-full">
					<main class="p-6">
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
				</ScrollArea>
			</div>
		</div>
	{:else if success}
		<div class="flex h-screen overflow-hidden bg-background">
			<div class="flex-1 transition-all duration-300">
				<ScrollArea class="h-full">
					<main class="p-6">
						<div class="flex flex-col items-center justify-center">
							<h1 class="text-2xl font-bold">Access request sent successfully</h1>
							<p class="text-muted-foreground">
								Your request has been sent to the admin. You will receive an email once it's
								approved.
							</p>
							<Button onclick={() => goto('/')}>Go back Home</Button>
						</div>
					</main>
				</ScrollArea>
			</div>
		</div>
	{/if}
{:else}
	<div class="flex h-screen overflow-hidden bg-background">
		<div class="flex-1 transition-all duration-300">
			<ScrollArea class="h-full">
				<main class="p-6">
					<div class="flex flex-col items-center justify-center">
						<h1 class="text-2xl font-bold">Loading...</h1>
					</div>
				</main>
			</ScrollArea>
		</div>
	</div>
{/if}
