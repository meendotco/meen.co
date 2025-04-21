<script lang="ts">
	import { Building2, Check, Linkedin } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import { Badge } from '@/components/ui/badge';
	import { Button } from '@/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
	import { Checkbox } from '@/components/ui/checkbox';
	import { Skeleton } from '@/components/ui/skeleton';

	interface UserPreferences {
		darkMode: boolean;
		notifications: boolean;
		emailUpdates: boolean;
	}

	let { data } = $props();
	let isLoading = $state(true);
	let hasChanges = $state(false);
	let isSaving = $state(false);

	let userPreferences = $state(data.user.preferences as UserPreferences);
	let organization = $derived(data.userOrganization);

	let originalPreferences = $state<UserPreferences>({
		darkMode: false,
		notifications: false,
		emailUpdates: false
	});

	onMount(async () => {
		await loadUserPreferences();
	});

	async function loadUserPreferences() {
		try {
			isLoading = true;
			// In production, you would fetch preferences from the server here
			// This is a placeholder for the API call
			await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

			originalPreferences = { ...data.user.preferences } as UserPreferences;
			hasChanges = false;
		} catch (error) {
			console.error('Failed to load user preferences:', error);
			toast.error('Failed to load settings', {
				description: 'Please refresh the page to try again'
			});
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		if (userPreferences && originalPreferences) {
			hasChanges =
				userPreferences.darkMode !== originalPreferences.darkMode ||
				userPreferences.notifications !== originalPreferences.notifications ||
				userPreferences.emailUpdates !== originalPreferences.emailUpdates;
		}
	});

	async function handleSave() {
		try {
			isSaving = true;

			const response = await fetch('/api/user/preferences', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(userPreferences)
			});

			if (!response.ok) {
				throw new Error('Failed to save preferences');
			}

			data.user.preferences = { ...userPreferences };
			originalPreferences = { ...userPreferences };
			hasChanges = false;

			toast.success('Preferences saved', {
				description: 'Your settings have been updated successfully'
			});
		} catch (error) {
			console.error('Failed to save preferences:', error);

			toast.error('Error saving preferences', {
				description: 'Please try again later'
			});
		} finally {
			isSaving = false;
		}
	}

	function handleCancel() {
		userPreferences = { ...originalPreferences };
		hasChanges = false;
	}
</script>

<div class="container mx-auto max-w-5xl py-8">
	<div class="mb-8 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Settings</h2>
	</div>

	<Card class="mb-8 border shadow-sm">
		<CardHeader class="px-8">
			<CardTitle>User Preferences</CardTitle>
			<CardDescription>Manage your account settings and preferences</CardDescription>
		</CardHeader>
		<CardContent class="px-8 pb-8">
			<div class="grid gap-6">
				<div class="flex flex-col space-y-4">
					{#if isLoading}
						<div class="flex items-center space-x-2">
							<Skeleton class="h-5 w-5" />
							<Skeleton class="h-4 w-40" />
						</div>
						<div class="flex items-center space-x-2">
							<Skeleton class="h-5 w-5" />
							<Skeleton class="h-4 w-56" />
						</div>
						<div class="flex items-center space-x-2">
							<Skeleton class="h-5 w-5" />
							<Skeleton class="h-4 w-52" />
						</div>
					{:else}
						<div class="flex items-center space-x-2">
							<Checkbox id="notifications" bind:checked={userPreferences.notifications} />
							<label
								for="notifications"
								class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								Enable Notifications
							</label>
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox id="email-updates" bind:checked={userPreferences.emailUpdates} />
							<label
								for="email-updates"
								class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								Receive Email Updates
							</label>
						</div>
					{/if}
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
				{#if isLoading}
					<div class="flex flex-col space-y-3">
						<Skeleton class="h-6 w-48" />
						<Skeleton class="h-4 w-32" />
						<Skeleton class="h-4 w-24" />
					</div>
				{:else if organization}
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
				{#if isLoading}
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
				{:else}
					<div class="flex items-center justify-between rounded-lg border p-4">
						<div class="flex items-center space-x-4">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
							>
								<Linkedin />
							</div>
							<div>
								<p class="font-medium">LinkedIn</p>
								<p class="text-sm text-muted-foreground">
									{data.user.name + ' (' + data.user.email + ')'}
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
			</div>
		</CardContent>
	</Card>

	{#if hasChanges}
		<div class="mt-8 flex justify-end space-x-4 px-4">
			<Button variant="outline" on:click={handleCancel} disabled={isSaving || isLoading}
				>Cancel</Button
			>
			<Button
				class="bg-primary text-primary-foreground hover:bg-primary/90"
				on:click={handleSave}
				disabled={isSaving || isLoading}
			>
				{isSaving ? 'Saving...' : 'Save All Changes'}
			</Button>
		</div>
	{/if}
</div>
