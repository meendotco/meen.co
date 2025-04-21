<script lang="ts">
	import { Building2, Check, Linkedin } from 'lucide-svelte';

	import { Badge } from '@/components/ui/badge';
	import { Button } from '@/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';

	let { data } = $props();
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
									<Building2 size={20} />
								</div>
								<div>
									<p class="font-medium">{organization.handle}</p>
									<div class="flex space-x-2 text-sm text-muted-foreground">
										<span>Members: {organization.users.length}</span>
									</div>
								</div>
							</div>
							<Button variant="outline" disabled class="h-8 text-xs">Manage</Button>
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
