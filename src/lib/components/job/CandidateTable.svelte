<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';
	import { ArrowUpDown } from 'lucide-svelte';
	import type { PersonEndpointResponse } from 'proxycurl-js-linkedin-profile-scraper';

	import { Button } from '$lib/components/ui/button';
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
	};

	let { candidates } = $props<{ candidates: CandidateSelect[] }>();

	type SortKey = 'matchScore' | 'name' | 'title';
	type SortDirection = 'asc' | 'desc';

	let sortKey = $state<SortKey>('matchScore');
	let sortDirection = $state<SortDirection>('desc');

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
			<Table.Head>LinkedIn</Table.Head>
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
					<Table.Cell>{profileData?.headline ?? 'N/A'}</Table.Cell>
					<Table.Cell class="text-center">
						{candidate.matchScore != null ? candidate.matchScore : 'N/A'}/100
					</Table.Cell>
					<Table.Cell class="text-center">
						{candidate.reasoning != null ? candidate.reasoning : 'N/A'}
					</Table.Cell>
					<Table.Cell>
						{#if profileData?.public_identifier}
							<a
								href={`https://www.linkedin.com/in/${profileData.public_identifier}`}
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary hover:underline"
							>
								View Profile
							</a>
						{:else}
							N/A
						{/if}
					</Table.Cell>
				</Table.Row>
			{/each}
		{:else}
			<Table.Row>
				<Table.Cell colspan={4} class="h-24 text-center text-muted-foreground">
					No candidates found for this job yet.
				</Table.Cell>
			</Table.Row>
		{/if}
	</Table.Body>
</Table.Root>
