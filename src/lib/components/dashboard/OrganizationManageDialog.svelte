<script lang="ts">
	import { Building2, Upload, X } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent, DialogFooter, DialogHeader } from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import type { Organization, OrganizationUpdatePayload } from '$lib/types/organization';

	const props = $props<{
		open: boolean;
		organization: Organization | null;
	}>();

	let orgLogoBase64 = $state<string | null>(null);
	let orgPrimaryColor = $state<string | null>(null);

	const dispatch = createEventDispatcher<{
		close: void;
		save: OrganizationUpdatePayload;
	}>();

	$effect(() => {
		if (props.organization) {
			orgLogoBase64 = props.organization.logo || null;
			orgPrimaryColor = props.organization.theme || null;
		}
	});

	function handleLogoChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			const reader = new FileReader();
			reader.onload = (e) => {
				orgLogoBase64 = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function handleClose() {
		dispatch('close');
	}

	async function saveOrgSettings() {
		const payload: OrganizationUpdatePayload = {
			theme: orgPrimaryColor,
			logo: orgLogoBase64
		};

		dispatch('save', payload);
	}
</script>

<Dialog open={props.open}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<span class="text-lg font-semibold leading-none tracking-tight">Manage Organization</span>
			<span class="text-sm text-muted-foreground">Update your organization settings</span>
		</DialogHeader>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<label for="primary-color">Primary Color</label>
				<div class="flex items-center gap-4">
					<div
						class="h-10 w-10 rounded-md border"
						style="background-color: {orgPrimaryColor};"
					></div>
					<Input id="primary-color" type="color" bind:value={orgPrimaryColor} class="h-10 w-full" />
				</div>
				<p class="text-xs text-muted-foreground">
					Pick a primary color for your organization theme
				</p>
			</div>

			<div class="grid gap-2">
				<label for="color-schema">Color Schema</label>
				<div class="grid grid-cols-5 gap-2">
					<Button
						type="button"
						variant="ghost"
						class="h-8 w-full bg-[#6D2EE0] p-0 hover:bg-[#6D2EE0]"
						onclick={() => (orgPrimaryColor = '#6D2EE0')}
					>
						<span class="sr-only">Purple theme</span>
					</Button>
					<Button
						type="button"
						variant="ghost"
						class="h-8 w-full bg-blue-500 p-0 hover:bg-blue-600"
						onclick={() => (orgPrimaryColor = '#3b82f6')}
					>
						<span class="sr-only">Blue theme</span>
					</Button>
					<Button
						type="button"
						variant="ghost"
						class="h-8 w-full bg-green-500 p-0 hover:bg-green-600"
						onclick={() => (orgPrimaryColor = '#10b981')}
					>
						<span class="sr-only">Green theme</span>
					</Button>
					<Button
						type="button"
						variant="ghost"
						class="h-8 w-full bg-red-500 p-0 hover:bg-red-600"
						onclick={() => (orgPrimaryColor = '#ef4444')}
					>
						<span class="sr-only">Red theme</span>
					</Button>
					<Button
						type="button"
						variant="ghost"
						class="h-8 w-full bg-orange-500 p-0 hover:bg-orange-600"
						onclick={() => (orgPrimaryColor = '#f97316')}
					>
						<span class="sr-only">Orange theme</span>
					</Button>
				</div>
				<p class="text-xs text-muted-foreground">
					Choose a predefined color or customize with the color picker above
				</p>
			</div>

			<div class="grid gap-2">
				<label for="logo">Logo</label>
				<div class="flex items-center gap-4">
					<div class="flex h-16 w-16 items-center justify-center rounded-md border border-dashed">
						{#if orgLogoBase64}
							<div class="group relative h-14 w-14" onclick={() => (orgLogoBase64 = null)}>
								<img
									src={orgLogoBase64}
									alt="Logo preview"
									class="h-14 w-14 cursor-pointer rounded-md object-cover transition-opacity group-hover:opacity-70"
								/>
								<div
									class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
								>
									<X size={20} class="text-foreground" />
								</div>
							</div>
						{:else}
							<Building2 size={24} class="text-muted-foreground" />
						{/if}
					</div>
					<div class="flex-1">
						<label
							for="logo-upload"
							class="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
						>
							<Upload class="mr-2 h-4 w-4" />
							<span>Upload</span>
							<input
								id="logo-upload"
								type="file"
								class="sr-only"
								accept="image/*"
								onchange={handleLogoChange}
							/>
						</label>
					</div>
				</div>
				<p class="text-xs text-muted-foreground">
					Upload a square image, min 200x200px. Click on existing logo to remove it.
				</p>
			</div>
		</div>
		<DialogFooter>
			<Button variant="outline" onclick={handleClose}>Cancel</Button>
			<Button onclick={saveOrgSettings}>Save changes</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
