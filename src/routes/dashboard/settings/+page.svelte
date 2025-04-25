<script lang="ts">
	import { Building2, Check, Linkedin, User } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	import { Badge } from '@/components/ui/badge';
	import { Button } from '@/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';
	import OrganizationManageDialog from '$lib/components/dashboard/OrganizationManageDialog.svelte';
	import type { Organization, OrganizationUpdatePayload } from '$lib/types/organization';

	let { data } = $props();

	let showOrgDialog = $state(false);
	let currentOrganization = $state<Organization | null>(null);

	function openManageOrg(org: Organization) {
		currentOrganization = org;
		showOrgDialog = true;
	}

	async function handleOrgSave(event: CustomEvent<OrganizationUpdatePayload>) {
		const payload = event.detail;
		try {
			const response = await fetch('/api/organization', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					handle: currentOrganization?.handle,
					...payload
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to update organization settings');
			}

			showOrgDialog = false;

			toast.success('Organization settings updated successfully');

			// to reload the organization image on the organization card
			if (currentOrganization) {
				currentOrganization.logo = payload.logo;
				currentOrganization.theme = payload.theme;
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update organization');
		}
	}
</script>

<div class="container mx-auto max-w-5xl py-8">
	<div class="mb-8 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Settings</h2>
	</div>
	<Card class="mb-8 border shadow-sm">
		<CardHeader class="px-8">
			<CardTitle>User Information</CardTitle>
			<CardDescription>Manage your account settings and preferences</CardDescription>
		</CardHeader>
		<CardContent class="px-8 pb-8">
			<div class="grid gap-6">
				<div class="flex flex-col space-y-4">
					<div class="flex items-center space-x-4">
						{#if data.user?.image}
							<img
								src={data.user.image}
								alt="Profile"
								class="h-12 w-12 rounded-full object-cover"
							/>
						{:else}
							<div
								class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
							>
								<User size={24} />
							</div>
						{/if}
						<div>
							<p class="font-medium">{data.user?.name || 'Unknown User'}</p>
							<p class="text-sm text-muted-foreground">{data.user?.email || 'No email'}</p>
							{#if data.user?.organizationHandle}
								<Badge variant="outline" class="mt-1">
									{data.user.organizationHandle}
								</Badge>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>

	<Card class="mb-8 border shadow-sm">
		<CardHeader class="px-8">
			<CardTitle>Organization</CardTitle>
			<CardDescription>Your organization details and membership</CardDescription>
		</CardHeader>
		<CardContent class="px-8 pb-8">
			<div class="space-y-4">
				{#await data.userOrganization}
					<div class="flex flex-col space-y-3">
						<Skeleton class="h-6 w-48" />
						<Skeleton class="h-4 w-32" />
						<Skeleton class="h-4 w-24" />
					</div>
				{:then organization}
					{#if organization}
						<div class="flex items-center justify-between rounded-lg border bg-primary/5 p-4">
							<div class="flex items-center space-x-4">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
								>
									{#if organization.logo}
										<img
											src={currentOrganization
												? organization.logo !== currentOrganization.logo
													? currentOrganization.logo
													: organization.logo
												: organization.logo}
											alt="Logo"
											class="h-8 w-8 rounded-full object-cover"
										/>
									{:else}
										<Building2 size={20} />
									{/if}
								</div>
								<div>
									<p class="font-medium">{organization.handle}</p>
									<div class="flex space-x-2 text-sm text-muted-foreground">
										<span>Members: {organization.users.length}</span>
									</div>
								</div>
							</div>
							<Button
								variant="outline"
								class="h-8 text-xs"
								onclick={() => openManageOrg(organization)}>Manage</Button
							>
						</div>
						<div class="text-sm text-muted-foreground">
							Organization ID: <span class="font-mono">{organization.handle}</span>
						</div>
					{:else}
						<div
							class="flex flex-col items-center justify-center space-y-2 rounded-lg border border-dashed p-4"
						>
							<p class="text-muted-foreground">No organization found</p>
							<Button variant="outline" size="sm">Create Organization</Button>
						</div>
					{/if}
				{/await}
			</div>
		</CardContent>
	</Card>

	<Card class="mb-8 border shadow-sm">
		<CardHeader class="px-8">
			<CardTitle>Connected Accounts</CardTitle>
			<CardDescription>Manage your connected accounts and services</CardDescription>
		</CardHeader>
		<CardContent class="px-8 pb-8">
			<div class="space-y-4">
				{#await data.userAccounts}
					<div class="flex items-center justify-between rounded-lg border p-4">
						<div class="flex items-center space-x-4">
							<Skeleton class="h-10 w-10 rounded-full" />
							<div>
								<Skeleton class="mb-1 h-5 w-24" />
								<Skeleton class="h-4 w-48" />
							</div>
						</div>
						<Skeleton class="h-6 w-24" />
					</div>
				{:then connectedAccounts}
					{#if connectedAccounts && connectedAccounts.length > 0}
						{#each connectedAccounts as account, index (index)}
							{#if account.provider === 'linkedin'}
								<div class="flex items-center justify-between rounded-lg border p-4">
									<div class="flex items-center space-x-4">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
										>
											<Linkedin />
										</div>
										<div>
											<p class="font-medium">{account.provider}</p>
											<p class="text-sm text-muted-foreground">
												expires ({account.expires_at
													? new Date(account.expires_at * 1000).toLocaleDateString()
													: 'unknown'})
											</p>
										</div>
									</div>
									<Badge
										variant="outline"
										class="gap-1 border-green-500 text-green-600 dark:border-green-500 dark:text-green-400"
									>
										<Check class="mr-1" size={16} />
										Connected
									</Badge>
								</div>
							{/if}

							{#if account.provider === 'google'}
								<div class="flex items-center justify-between rounded-lg border p-4">
									<div class="flex items-center space-x-4">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
										>
											<img src="/logos/google.png" alt="Google" class="h-8 w-8" />
										</div>
										<div>
											<p class="font-medium">{account.provider}</p>
											<p class="text-sm text-muted-foreground">
												expires ({account.expires_at
													? new Date(account.expires_at * 1000).toLocaleDateString()
													: 'unknown'})
											</p>
										</div>
									</div>
									<Badge
										variant="outline"
										class="gap-1 border-green-500 text-green-600 dark:border-green-500 dark:text-green-400"
									>
										<Check class="mr-1" size={16} />
										Connected
									</Badge>
								</div>
							{/if}
						{/each}
					{:else}
						<div
							class="flex flex-col items-center justify-center space-y-2 rounded-lg border border-dashed p-4"
						>
							<p class="text-muted-foreground">No connected accounts found</p>
						</div>
					{/if}
				{/await}
			</div>
		</CardContent>
	</Card>
</div>

<!-- Organization Management Dialog -->
<OrganizationManageDialog
	open={showOrgDialog}
	organization={currentOrganization}
	on:close={() => (showOrgDialog = false)}
	on:save={handleOrgSave}
/>
