<script lang="ts">
	import { Search } from '@lucide/svelte';

	import { Button } from '@/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
	import { Input } from '@/components/ui/input';
	import { Skeleton } from '@/components/ui/skeleton';
	import CandidateCard from '$lib/components/dashboard/CandidateCard.svelte';
	import type { Candidate, SearchResultItem } from '$lib/types/candidate';

	let { data }: { data: { candidates: Candidate[] } } = $props();

	let addUrlQuery = $state('');
	let searchQuery = $state('');
	let searchResults = $state<SearchResultItem[]>([]);
	let isSearching = $state(false);

	async function manuallyAddCandidate(query: string) {
		await fetch(`/api/candidate/add`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ linkedinUrl: query })
		});
		window.location.reload();
	}

	async function searchCandidates(query: string) {
		if (!query.trim()) return;

		isSearching = true;
		try {
			const response = await fetch(`/api/candidate/scan`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ query })
			});
			const data = await response.json();
			searchResults = data;
		} finally {
			isSearching = false;
		}
	}
</script>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<div class="mb-8 flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Search Candidates</h2>
	</div>

	<div class="mb-10 grid gap-6 md:grid-cols-2">
		<Card class="border-none shadow-md transition-all duration-200 hover:shadow-lg">
			<CardHeader class="pb-3">
				<CardTitle class="text-xl font-semibold">Start a candidate scan</CardTitle>
				<CardDescription>Let an agent scan candidates for you based on your needs</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="flex space-x-2">
					<div class="relative flex-1">
						<Search
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							bind:value={searchQuery}
							type="search"
							placeholder="Search candidates..."
							class="border-primary/20 pl-10 focus:border-primary focus-visible:ring-transparent"
						/>
					</div>
					<Button
						disabled={isSearching}
						onclick={() => searchCandidates(searchQuery)}
						class="group relative overflow-hidden"
					>
						<span class="relative z-10">{isSearching ? 'Searching...' : 'Search'}</span>
						<span
							class="absolute inset-0 w-0 bg-primary/10 transition-all duration-300 group-hover:w-full"
						></span>
					</Button>
				</div>
			</CardContent>
		</Card>

		<Card class="border-none shadow-md transition-all duration-200 hover:shadow-lg">
			<CardHeader class="pb-3">
				<CardTitle class="text-xl font-semibold">Manually Add Candidate</CardTitle>
				<CardDescription>Add a candidate using their LinkedIn profile URL</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="flex space-x-2">
					<div class="relative flex-1">
						<Input
							bind:value={addUrlQuery}
							type="url"
							placeholder="Enter LinkedIn URL"
							class="border-primary/20 pl-3 focus:border-primary focus-visible:ring-transparent"
						/>
					</div>
					<Button
						onclick={() => manuallyAddCandidate(addUrlQuery)}
						class="group relative overflow-hidden"
					>
						<span class="relative z-10">Add Candidate</span>
						<span
							class="absolute inset-0 w-0 bg-primary/10 transition-all duration-300 group-hover:w-full"
						></span>
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>

	{#if searchResults.length > 0}
		<div class="mb-8">
			<h1
				class="mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-2xl font-bold text-transparent"
			>
				Search Results
			</h1>
			<div class="grid gap-4">
				{#each searchResults as result (result.data.public_identifier)}
					<CandidateCard candidateData={result.data} b64="">
						<div slot="actions" class="flex flex-col gap-2">
							<Button variant="outline" size="sm" class="transition-colors hover:bg-primary/5"
								>View Profile</Button
							>
							<Button size="sm" class="transition-colors hover:bg-primary/90">Contact</Button>
						</div>
					</CandidateCard>
				{/each}
			</div>
		</div>
		<h1
			class="mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-2xl font-bold text-transparent"
		>
			All Profiles
		</h1>
	{/if}

	<div class="grid gap-4">
		{#await data.candidates}
			{#each [...Array(4).keys()] as i (i)}
				<Card class="overflow-hidden transition-all duration-200 hover:shadow-md">
					<CardContent class="p-0">
						<div class="h-8 bg-gradient-to-r from-primary/10 to-primary/5"></div>
						<div class="relative px-4 pb-4 pt-1">
							<div class="flex items-start gap-3">
								<div class="relative -mt-6">
									<Skeleton class="border-3 h-12 w-12 rounded-full border-background shadow-sm" />
								</div>

								<div class="flex-1 space-y-2 pt-1">
									<div>
										<Skeleton class="mb-2 h-4 w-[180px]" />
										<Skeleton class="h-3 w-[250px]" />
									</div>

									<div class="flex flex-wrap gap-1">
										<Skeleton class="h-5 w-[100px] rounded-full" />
										<Skeleton class="h-5 w-[120px] rounded-full" />
									</div>

									<div>
										<Skeleton class="mb-2 h-3 w-[60px]" />
										<div class="flex flex-wrap gap-1">
											<Skeleton class="h-5 w-[80px] rounded-full" />
											<Skeleton class="h-5 w-[90px] rounded-full" />
											<Skeleton class="h-5 w-[70px] rounded-full" />
										</div>
									</div>

									<div>
										<Skeleton class="mb-2 h-3 w-[80px]" />
										<div class="border-l-2 border-primary/20 py-0 pl-2">
											<Skeleton class="mb-1 h-3 w-[160px]" />
											<Skeleton class="h-3 w-[100px]" />
										</div>
									</div>
								</div>

								<div class="flex flex-col gap-1 self-start pt-1">
									<Skeleton class="h-8 w-[80px] rounded-md" />
									<Skeleton class="h-8 w-[80px] rounded-md" />
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		{:then candidates}
			{#each candidates as candidate (candidate.id)}
				<CandidateCard candidateData={candidate.data} b64={candidate.profileImageB64 || ''}>
					<div slot="actions" class="flex flex-col gap-2">
						<Button
							href={`/dashboard/candidates/${candidate.handle}`}
							variant="outline"
							size="sm"
							class="transition-colors hover:bg-primary/5"
						>
							View Profile
						</Button>
						<Button size="sm" class="transition-colors hover:bg-primary/90">Contact</Button>
					</div>
				</CandidateCard>
			{:else}
				<div class="rounded-lg border bg-card p-8 text-center shadow-sm">
					<p class="text-muted-foreground">No candidates found</p>
					<Button variant="outline" class="mt-4 hover:bg-primary/5 transition-colors"
						>Add your first candidate</Button
					>
				</div>
			{/each}
		{/await}
	</div>
</div>
