<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';
	import { ArrowUpDown, CheckIcon, PlusIcon } from 'lucide-svelte';
	import type { PersonEndpointResponse } from 'proxycurl-js-linkedin-profile-scraper';

	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Table from '$lib/components/ui/table';
	import type {
		candidates as candidatesTable,
		linkedInProfile as linkedInProfileTable
	} from '$lib/server/db/schema';

	type LinkedInProfileSelect = InferSelectModel<typeof linkedInProfileTable> & {
		data?: PersonEndpointResponse | null;
	};
	type CandidateSelect = InferSelectModel<typeof candidatesTable> & {
		linkedInProfile: LinkedInProfileSelect | null;
		matchScore?: number | null;
		reasoning?: string | null;
	};

	let { candidates } = $props<{ candidates: CandidateSelect[] }>();

	type SortKey = 'matchScore' | 'name' | 'title';
	type SortDirection = 'asc' | 'desc';

	let sortKey = $state<SortKey>('matchScore');
	let sortDirection = $state<SortDirection>('desc');

	let customFields = $state<{ name: string; type: 'number' | 'text' }[]>([]);
	let newFieldName = $state('');
	let isAddDialogOpen = $state(false);

	const sortedCandidates: CandidateSelect[] = $derived.by(() => {
		return [...candidates].sort((a: CandidateSelect, b: CandidateSelect) => {
			const aProfileData = a.linkedInProfile?.data;
			const bProfileData = b.linkedInProfile?.data;
			const aName = `${aProfileData?.first_name ?? ''} ${aProfileData?.last_name ?? ''}`.trim();
			const bName = `${bProfileData?.first_name ?? ''} ${bProfileData?.last_name ?? ''}`.trim();
			const aTitle = aProfileData?.headline ?? '';
			const bTitle = bProfileData?.headline ?? '';
			const aScore = a.matchScore ?? -Infinity;
			const bScore = b.matchScore ?? -Infinity;

			let comparison = 0;

			if (sortKey === 'name') {
				comparison = aName.localeCompare(bName);
			} else if (sortKey === 'title') {
				comparison = aTitle.localeCompare(bTitle);
			} else if (sortKey === 'matchScore') {
				comparison = aScore - bScore;
			}

			return sortDirection === 'asc' ? comparison : -comparison;
		});
	});

	function sortBy(key: SortKey) {
		if (sortKey === key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDirection = 'asc';
		}
	}

	function addField() {
		if (!newFieldName.trim()) return; // Prevent adding empty field names
		customFields.push({ type: 'text', name: newFieldName.trim() });
		newFieldName = ''; // Reset input
		isAddDialogOpen = false; // Close dialog
	}

	const totalColspan = $derived(4 + customFields.length);
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-[250px]">
				<Button variant="ghost" onclick={() => sortBy('name')}>
					Name
					<ArrowUpDown class="ml-2 h-4 w-4" />
				</Button>
			</Table.Head>
			<Table.Head>
				<Button variant="ghost" onclick={() => sortBy('title')}>
					Title
					<ArrowUpDown class="ml-2 h-4 w-4" />
				</Button>
			</Table.Head>
			<Table.Head>
				<Button variant="ghost" onclick={() => sortBy('matchScore')}>
					Assessment
					<ArrowUpDown class="ml-2 h-4 w-4" />
				</Button>
			</Table.Head>
			<Table.Head>Reasoning</Table.Head>

			{#each customFields as field (field.name)}
				<Table.Head>
					{field.name}
				</Table.Head>
			{/each}

			<Table.Head class="w-auto text-right">
				<Dialog.Root bind:open={isAddDialogOpen}>
					<Dialog.Trigger asChild let:builder>
						<Button
							onclick={() => (isAddDialogOpen = true)}
							builders={[builder]}
							variant="outline"
							size="sm"
						>
							<PlusIcon class="mr-1 h-4 w-4" /> Add Field
						</Button>
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Add Custom Field</Dialog.Title>
							<Dialog.Description>Enter the name for the new custom field.</Dialog.Description>
						</Dialog.Header>
						<div class="grid gap-4 py-4">
							<p>Field Name</p>
							<Input
								id="name"
								bind:value={newFieldName}
								placeholder="e.g., 'Contacted Date'"
								class="col-span-3"
							/>
						</div>
						<Dialog.Footer>
							<Button variant="outline" onclick={() => (isAddDialogOpen = false)}>Cancel</Button>
							<Button onclick={addField}>Add Field</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#if sortedCandidates.length > 0}
			{#each sortedCandidates as candidate (candidate.id)}
				{@const profileData = candidate.linkedInProfile?.data}
				<Table.Row>
					<Table.Cell class="font-medium">
						{`${profileData?.first_name ?? ''} ${profileData?.last_name ?? ''}`.trim() || 'N/A'}
					</Table.Cell>
					<Table.Cell>
						{#if profileData?.headline}
							{profileData.headline.length > 50
								? `${profileData.headline.slice(0, 50)}...`
								: profileData.headline}
						{:else}
							N/A
						{/if}
					</Table.Cell>
					<Table.Cell class="text-center">
						{candidate.matchScore != null ? candidate.matchScore : 'N/A'}/100
					</Table.Cell>
					<Table.Cell class="text-center">
						{candidate.reasoning != null ? candidate.reasoning : 'N/A'}
					</Table.Cell>
					{#each customFields as field (field.name)}
						{#if field.type === 'number'}
							<Table.Cell class="text-center">N/A</Table.Cell>
						{:else if field.type === 'text'}
							<Table.Cell>N/A</Table.Cell>
						{/if}
					{/each}
				</Table.Row>
			{/each}
		{:else}
			<Table.Row>
				<Table.Cell colspan={totalColspan} class="h-24 text-center text-muted-foreground">
					No candidates found for this job yet.
				</Table.Cell>
			</Table.Row>
		{/if}
	</Table.Body>
</Table.Root>
