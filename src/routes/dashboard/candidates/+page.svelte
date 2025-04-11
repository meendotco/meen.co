<script lang="ts">
	import { Search } from '@lucide/svelte';

	import { Button } from '@/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
	import { Input } from '@/components/ui/input';

	let { data } = $props();

	let addUrlQuery = $state('');
	let searchQuery = $state('');

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
		await fetch(`/api/candidate/search`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ query })
		});
		window.location.reload();
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Search Candidates</h2>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Find Candidates</CardTitle>
				<CardDescription>
					Search for candidates based on skills, experience, or job post
				</CardDescription>
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
							class="pl-10"
						/>
					</div>
					<Button onclick={() => searchCandidates(searchQuery)}>Search</Button>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Manually Add Candidate</CardTitle>
				<CardDescription>Add a candidate using their LinkedIn profile URL</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="flex space-x-2">
					<div class="relative flex-1">
						<Input
							bind:value={addUrlQuery}
							type="url"
							placeholder="Enter LinkedIn URL"
							class="pl-3"
						/>
					</div>
					<Button onclick={() => manuallyAddCandidate(addUrlQuery)}>Add Candidate</Button>
				</div>
			</CardContent>
		</Card>
	</div>

	<div class="grid gap-6">
		{#each data.candidates as candidate (candidate.id)}
			<div class="rounded-lg border bg-card p-6 shadow-sm">
				<div class="flex items-start gap-4">
					{#if candidate.data.profile_pic_url}
						<img
							src={candidate.data.profile_pic_url}
							alt={candidate.data.full_name}
							class="h-16 w-16 rounded-full object-cover"
						/>
					{:else}
						<div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
							<span class="text-xl font-semibold"
								>{candidate.data.first_name?.[0]}{candidate.data.last_name?.[0]}</span
							>
						</div>
					{/if}

					<div class="flex-1 space-y-2">
						<div>
							<h3 class="text-xl font-semibold">{candidate.data.full_name}</h3>
							<p class="text-sm text-muted-foreground">{candidate.data.headline}</p>
						</div>

						<div class="flex flex-wrap gap-1">
							{#if candidate.data.location}
								<span class="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
									{candidate.data.city}, {candidate.data.country_full_name}
								</span>
							{/if}
							{#if candidate.data.connections}
								<span class="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
									{candidate.data.connections} connections
								</span>
							{/if}
						</div>

						{#if candidate.data.skills && candidate.data.skills.length > 0}
							<div>
								<h4 class="text-sm font-medium">Skills</h4>
								<div class="mt-1 flex flex-wrap gap-1">
									{#each candidate.data.skills.slice(0, 8) as skill (skill)}
										<span
											class="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs text-primary"
										>
											{skill}
										</span>
									{/each}
									{#if candidate.data.skills.length > 8}
										<span class="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
											+{candidate.data.skills.length - 8} more
										</span>
									{/if}
								</div>
							</div>
						{/if}

						{#if candidate.data.people_also_viewed}
							<div>
								<h4 class="text-sm font-medium">People also viewed</h4>
								<div class="mt-1 space-y-1">
									{#each candidate.data.people_also_viewed.slice(0, 2) as person (person.link)}
										<p class="text-sm font-medium">{person.name}</p>
										<p class="text-xs text-muted-foreground">
											{person.link}
										</p>
									{/each}
								</div>
							</div>
						{/if}
						{#if candidate.data.experiences && candidate.data.experiences.length > 0}
							<div>
								<h4 class="text-sm font-medium">Experience</h4>
								<div class="mt-1 space-y-1">
									{#each candidate.data.experiences.slice(0, 2) as experience (experience.company + experience.title)}
										<div>
											<p class="text-sm font-medium">{experience.title} at {experience.company}</p>
											{#if experience.starts_at}
												<p class="text-xs text-muted-foreground">
													{experience.starts_at.year} - {experience.ends_at
														? experience.ends_at.year
														: 'Present'}
												</p>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<div class="flex flex-col gap-2">
						<Button variant="outline" size="sm">View Profile</Button>
						<Button size="sm">Contact</Button>
					</div>
				</div>
			</div>
		{:else}
			<div class="rounded-lg border bg-card p-8 text-center">
				<p class="text-muted-foreground">No candidates found</p>
			</div>
		{/each}
	</div>
</div>
