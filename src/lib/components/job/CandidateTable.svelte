<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';
	import { ArrowUpDown, PlusIcon, Trash2 } from 'lucide-svelte';
	import type { PersonEndpointResponse } from 'proxycurl-js-linkedin-profile-scraper';

	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import type {
		candidates as candidatesTable,
		customField as customFieldTable,
		customFieldValue as customFieldValueTable,
		linkedInProfile as linkedInProfileTable
	} from '$lib/server/db/schema';

	type LinkedInProfileSelect = InferSelectModel<typeof linkedInProfileTable> & {
		data?: PersonEndpointResponse | null;
	};
	type CandidateSelect = InferSelectModel<typeof candidatesTable> & {
		linkedInProfile: LinkedInProfileSelect | null;
		matchScore?: number | null;
		reasoning?: string | null;
		customFieldValues?: CustomFieldValueSelect[] | null;
	};
	type CustomFieldValueSelect = InferSelectModel<typeof customFieldValueTable> & {
		customField: CustomFieldSelect;
	};
	type CustomFieldSelect = InferSelectModel<typeof customFieldTable>;
	let {
		candidates,
		jobId,
		customFields: customFieldsProp
	} = $props<{
		candidates: CandidateSelect[];
		jobId: string;
		customFields: CustomFieldSelect[];
	}>();

	// Updated SortKey to allow sorting by custom field names (strings)
	type SortKey = string | 'matchScore' | 'name' | 'title';
	type SortDirection = 'asc' | 'desc';

	let sortKey = $state<SortKey>('matchScore');
	let sortDirection = $state<SortDirection>('desc');

	let customFields = $state<CustomFieldSelect[]>(customFieldsProp);
	let newFieldName = $state('');
	let newFieldDescription = $state('');
	let newFieldType = $state<'boolean' | 'date' | 'number' | 'text'>('text');
	let isAddDialogOpen = $state(false);
	// State to track which delete dialog is open (using field ID as key)
	let deleteDialogStates = $state<Record<string, boolean>>({});

	// State for reusable cell content dialog
	let isCellDialogOpen = $state(false);
	let dialogContent = $state<string | null>(null);

	const sortedCandidates: CandidateSelect[] = $derived.by(() => {
		// Get local copies of state for the derivation
		const currentSortKey = sortKey;
		const currentSortDirection = sortDirection;

		return [...candidates].sort((a: CandidateSelect, b: CandidateSelect) => {
			let comparison = 0;

			// Predefined keys
			if (currentSortKey === 'name') {
				const aProfileData = a.linkedInProfile?.data;
				const bProfileData = b.linkedInProfile?.data;
				const aName = `${aProfileData?.first_name ?? ''} ${aProfileData?.last_name ?? ''}`.trim();
				const bName = `${bProfileData?.first_name ?? ''} ${bProfileData?.last_name ?? ''}`.trim();
				comparison = aName.localeCompare(bName);
			} else if (currentSortKey === 'title') {
				const aTitle = a.linkedInProfile?.data?.headline ?? '';
				const bTitle = b.linkedInProfile?.data?.headline ?? '';
				comparison = aTitle.localeCompare(bTitle);
			} else if (currentSortKey === 'matchScore') {
				// Handle null/undefined scores safely, treating them as lowest
				const aScore = a.matchScore ?? -Infinity;
				const bScore = b.matchScore ?? -Infinity;
				comparison = aScore - bScore;
			} else {
				// --- Custom Field Sorting ---
				const aValueData = a.customFieldValues?.find(
					(cfv) => cfv.customField?.name === currentSortKey
				);
				const bValueData = b.customFieldValues?.find(
					(cfv) => cfv.customField?.name === currentSortKey
				);

				const aValue = aValueData?.value;
				const bValue = bValueData?.value;
				const fieldType = aValueData?.customField?.type ?? bValueData?.customField?.type ?? 'text'; // Determine type

				// Default values for comparison if one value is missing
				const valA = aValue ?? (fieldType === 'number' ? -Infinity : '');
				const valB = bValue ?? (fieldType === 'number' ? -Infinity : '');

				switch (fieldType) {
					case 'number': {
						const numA = valA === -Infinity ? -Infinity : parseFloat(String(valA));
						const numB = valB === -Infinity ? -Infinity : parseFloat(String(valB));
						comparison = (isNaN(numA) ? -Infinity : numA) - (isNaN(numB) ? -Infinity : numB);
						break;
					}
					case 'date': {
						const dateA = new Date(String(valA));
						const dateB = new Date(String(valB));
						// Handle invalid dates by treating them as very early dates
						const timeA = isNaN(dateA.getTime()) ? -Infinity : dateA.getTime();
						const timeB = isNaN(dateB.getTime()) ? -Infinity : dateB.getTime();
						comparison = timeA - timeB;
						break;
					}
					case 'boolean': {
						// Treat 'true' as 1, 'false' or others as 0 for comparison
						const boolA = String(valA).toLowerCase() === 'true' ? 1 : 0;
						const boolB = String(valB).toLowerCase() === 'true' ? 1 : 0;
						comparison = boolA - boolB;
						break;
					}
					case 'text':
					default:
						comparison = String(valA).localeCompare(String(valB));
						break;
				}
			}

			return currentSortDirection === 'asc' ? comparison : -comparison;
		});
	});

	function sortBy(key: SortKey) {
		if (sortKey === key) {
			console.log('re-sorting');
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			console.log('sorting by new key', key);
			sortKey = key;
			sortDirection = 'asc';
		}
	}

	async function addField() {
		const name = newFieldName.trim();
		const description = newFieldDescription.trim();
		const type = newFieldType;

		if (!name || !description) return;

		// REMOVED: customFields.push({ type, name, description }); // This caused type error

		// const originalFieldName = newFieldName; // Keep track for potential revert if needed - Removed as revert logic is removed
		newFieldName = '';
		newFieldDescription = '';
		newFieldType = 'text';
		isAddDialogOpen = false;

		try {
			const response = await fetch(`/api/job/${jobId}/customfield`, {
				method: 'POST',
				body: JSON.stringify({ name, description, type })
			});

			if (!response.ok) {
				console.error('Failed to add custom field:', await response.text());
				// Consider adding UI feedback here
			} else {
				const data = await response.json();
				console.log('Custom field added:', data);
				// --- Trigger data refresh ---
				// Option 1: Full page reload (simple but less smooth)
				window.location.reload();
				// Option 2: Invalidate specific data (needs SvelteKit knowledge)
				// import { invalidate } from '$app/navigation';
				// invalidate((url) => url.pathname === `/dashboard/job/${jobId}`); // Adjust predicate if needed
			}
		} catch (error) {
			console.error('Error sending request:', error);
			// Consider adding UI feedback here
		}
	}

	async function deleteField(fieldId: string) {
		console.log(`Attempting to delete field: ${fieldId}`);
		try {
			const response = await fetch(`/api/job/${jobId}/customfield/${fieldId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Failed to delete custom field:', response.status, errorData);
				// Add user feedback here (e.g., toast notification)
			} else {
				console.log('Custom field deleted successfully');
				// Close the specific dialog
				deleteDialogStates[fieldId] = false;
				// Refresh data
				window.location.reload(); // Or use invalidate
			}
		} catch (error) {
			console.error('Error sending delete request:', error);
			// Add user feedback here
		}
	}

	const totalColspan = $derived(4 + customFields.length);

	function showFullContent(content: string | null | undefined) {
		if (content) {
			dialogContent = String(content); // Ensure it's a string
			isCellDialogOpen = true;
		}
	}
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

			{#each customFields as field (field.id)}
				<Table.Head>
					<div class="flex items-center justify-between">
						<Button
							variant="ghost"
							onclick={() => sortBy(field.name)}
							class="h-auto flex-grow justify-start p-0 text-left"
						>
							{field.name}
							<ArrowUpDown class="ml-2 h-4 w-4" />
						</Button>
						<Dialog.Root bind:open={deleteDialogStates[field.id]}>
							<Dialog.Trigger asChild let:builder>
								<Button
									builders={[builder]}
									variant="ghost"
									size="icon"
									class="ml-1 h-6 w-6 shrink-0 hover:bg-red-300 dark:hover:bg-red-500"
									aria-label={`Delete field ${field.name}`}
									onclick={() => (deleteDialogStates[field.id] = true)}
								>
									<Trash2 class="h-4 w-4 text-destructive" />
								</Button>
							</Dialog.Trigger>
							<Dialog.Content>
								<h4 class="text-lg font-semibold">Delete Custom Field</h4>
								<p>
									Are you sure you want to delete the field "{field.name}"? All associated data for
									this field will be permanently removed. This action cannot be undone.
								</p>
								<Dialog.Footer>
									<Button variant="outline" onclick={() => (deleteDialogStates[field.id] = false)}
										>Cancel</Button
									>
									<Button variant="destructive" onclick={() => deleteField(field.id)}>Delete</Button
									>
								</Dialog.Footer>
							</Dialog.Content>
						</Dialog.Root>
					</div>
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
								placeholder="e.g., 'Years of Experience'"
								class="col-span-3"
							/>
							<p>Field Description</p>
							<Input
								id="description"
								bind:value={newFieldDescription}
								placeholder="e.g., 'The number of years of experience the candidate has'"
								class="col-span-3"
							/>
							<p>Field Type</p>
							<Select.Root
								onSelectedChange={(selected) => {
									if (selected) {
										newFieldType = selected.value as typeof newFieldType;
									}
								}}
							>
								<Select.Trigger class="w-[180px]">
									<Select.Value placeholder="Select field type..." />
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="text">Text</Select.Item>
									<Select.Item value="number">Number</Select.Item>
									<Select.Item value="boolean">Boolean</Select.Item>
									<Select.Item value="date">Date</Select.Item>
								</Select.Content>
							</Select.Root>
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
				{@const fullName =
					`${profileData?.first_name ?? ''} ${profileData?.last_name ?? ''}`.trim() || 'N/A'}
				{@const headline = profileData?.headline ?? 'N/A'}
				{@const reasoning = candidate.reasoning != null ? String(candidate.reasoning) : 'N/A'}

				<Table.Row>
					{#if fullName !== 'N/A' && fullName.length > 100}
						<Table.Cell
							class="cursor-pointer font-medium"
							onclick={() => showFullContent(fullName)}
						>
							{fullName.slice(0, 100)}... (click to see more)
						</Table.Cell>
					{:else}
						<Table.Cell class="font-medium">{fullName}</Table.Cell>
					{/if}

					{#if headline !== 'N/A' && headline.length > 100}
						<Table.Cell class="cursor-pointer" onclick={() => showFullContent(headline)}>
							{headline.slice(0, 100)}... (click to see more)
						</Table.Cell>
					{:else}
						<Table.Cell>{headline}</Table.Cell>
					{/if}

					<Table.Cell class="text-center">
						{candidate.matchScore != null ? `${candidate.matchScore}/100` : 'N/A'}
					</Table.Cell>

					{#if reasoning !== 'N/A' && reasoning.length > 100}
						<Table.Cell
							class="cursor-pointer text-center"
							onclick={() => showFullContent(reasoning)}
						>
							{reasoning.slice(0, 100)}... (click to see more)
						</Table.Cell>
					{:else}
						<Table.Cell class="text-center">{reasoning}</Table.Cell>
					{/if}

					{#each customFields as field (field.id)}
						{@const fieldValue = candidate.customFieldValues?.find(
							(cfv) => cfv.customFieldId === field.id
						)?.value}
						{@const displayValue = fieldValue != null ? String(fieldValue) : 'N/A'}
						{@const isLong = displayValue !== 'N/A' && displayValue.length > 100}

						{#if field.type === 'boolean'}
							<Table.Cell class="text-center">{displayValue}</Table.Cell>
						{:else if field.type === 'date'}
							<Table.Cell class="text-center"
								>{fieldValue ? new Date(fieldValue).toLocaleDateString() : 'N/A'}</Table.Cell
							>
						{:else if isLong}
							<Table.Cell
								class="cursor-pointer {field.type === 'number' ? 'text-center' : ''}"
								onclick={() => showFullContent(fieldValue)}
							>
								{displayValue.slice(0, 100)}... (click to see more)
							</Table.Cell>
						{:else}
							<Table.Cell class={field.type === 'number' ? 'text-center' : ''}>
								{displayValue}
							</Table.Cell>
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

<!-- Reusable Dialog for Full Cell Content -->
<Dialog.Root bind:open={isCellDialogOpen}>
	<Dialog.Content class="max-w-xl">
		<Dialog.Header>
			<Dialog.Title>Full Value</Dialog.Title>
		</Dialog.Header>
		<div class="mt-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words">
			{dialogContent}
		</div>
	</Dialog.Content>
</Dialog.Root>
