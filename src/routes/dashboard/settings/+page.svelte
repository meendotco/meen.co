<script lang="ts">
	import { Button } from '@/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
	import { Input } from '@/components/ui/input';
	import { Skeleton } from '@/components/ui/skeleton';
	import { Checkbox } from '@/components/ui/checkbox';
	import { Badge } from '@/components/ui/badge';
	import { Linkedin, Check } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { toast } from "svelte-sonner";

	interface UserPreferences {
		darkMode: boolean;
		notifications: boolean;
		emailUpdates: boolean;
	}

	let { data, form } = $props();
	let hasChanges = $state(false);
	let isLoading = $state(true);
	let isSaving = $state(false);

	let userPreferences = $state(data.user.preferences as UserPreferences);

	let originalPreferences = $state<UserPreferences>({
		darkMode: false,
		notifications: false,
		emailUpdates: false
	});

	onMount(() => {
		loadUserPreferences();
	});

	async function loadUserPreferences() {
		try {
			originalPreferences = { ...data.user.preferences } as UserPreferences;
			hasChanges = false;
		} catch (error) {
			console.error('Failed to load user preferences:', error);
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
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2
			class="bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent"
		>
			Settings
		</h2>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>User Preferences</CardTitle>
			<CardDescription>Manage your account settings and preferences</CardDescription>
		</CardHeader>
		<CardContent>
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
							<Checkbox id="dark-mode" bind:checked={userPreferences.darkMode} />
							<label
								for="dark-mode"
								class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								Dark Mode
							</label>
						</div>
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

	<Card>
		<CardHeader>
			<CardTitle>Connected Accounts</CardTitle>
			<CardDescription>Manage your connected accounts and services</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
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
			</div>
		</CardContent>
	</Card>

	{#if hasChanges}
		<div class="flex justify-end space-x-4">
			<Button variant="outline" onclick={() => loadUserPreferences()} disabled={isSaving}
				>Cancel</Button
			>
			<Button
				class="bg-primary text-primary-foreground hover:bg-primary/90"
				onclick={handleSave}
				disabled={isSaving}
			>
				{isSaving ? 'Saving...' : 'Save All Changes'}
			</Button>
		</div>
	{/if}
</div>
