<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import type { CandidateData } from '$lib/types/candidate';

	let { candidateData, b64 }: { candidateData: CandidateData; b64: string } = $props();

	// Helper to get initials
	function getInitials(firstName?: string, lastName?: string): string {
		return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
	}

	// Helper to format location
	function formatLocation(data: CandidateData): string | null {
		if (data.city && data.country_full_name) {
			return `${data.city}, ${data.country_full_name}`;
		}
		return data.location ?? null;
	}
</script>

<Card class="overflow-hidden transition-all duration-200 hover:shadow-md">
	<CardContent class="p-0">
		<div class="relative mt-5 px-4 pb-4 pt-6">
			<div class="flex items-start gap-3">
				<div class="relative -mt-6">
					{#if b64}
						<img
							src={`data:image/png;base64,${b64}`}
							alt={candidateData.full_name ?? 'Profile'}
							class="border-3 h-12 w-12 rounded-full border-background object-cover shadow-sm"
						/>
					{:else}
						<div
							class="border-3 flex h-12 w-12 items-center justify-center rounded-full border-background bg-primary/10 shadow-sm"
						>
							<span class="text-base font-semibold text-primary">
								{getInitials(candidateData.first_name, candidateData.last_name)}
							</span>
						</div>
					{/if}
				</div>

				<div class="flex-1 space-y-2 pt-1">
					<div>
						<h3 class="text-base font-semibold tracking-tight">
							{candidateData.full_name ?? 'N/A'}
						</h3>
						<p class="text-xs font-medium text-muted-foreground">
							{candidateData.headline ?? 'N/A'}
						</p>
					</div>

					<div class="flex flex-wrap gap-1">
						{#if formatLocation(candidateData)}
							<Badge variant="outline" class="h-5 rounded-full py-0 text-xs font-normal">
								{formatLocation(candidateData)}
							</Badge>
						{/if}
						{#if candidateData.connections}
							<Badge variant="outline" class="h-5 rounded-full py-0 text-xs font-normal">
								{candidateData.connections} connections
							</Badge>
						{/if}
					</div>

					{#if candidateData.skills && candidateData.skills.length > 0}
						<div>
							<h4 class="mb-1 text-xs font-medium text-primary">Skills</h4>
							<div class="flex flex-wrap gap-1">
								{#each candidateData.skills.slice(0, 5) as skill (skill)}
									<Badge variant="secondary" class="h-5 rounded-full py-0 text-xs">
										{skill}
									</Badge>
								{/each}
								{#if candidateData.skills.length > 5}
									<Badge variant="outline" class="h-5 rounded-full py-0 text-xs">
										+{candidateData.skills.length - 5} more
									</Badge>
								{/if}
							</div>
						</div>
					{/if}

					{#if candidateData.experiences && candidateData.experiences.length > 0}
						<div>
							<h4 class="mb-1 text-xs font-medium text-primary">Experience</h4>
							<div class="space-y-1">
								{#each candidateData.experiences.slice(0, 1) as experience, index (index)}
									<div class="border-l-2 border-primary/20 py-0 pl-2">
										<p class="text-xs font-medium">{experience.title} at {experience.company}</p>
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

					{#if candidateData.people_also_viewed && candidateData.people_also_viewed.length > 0}
						<div>
							<h4 class="mb-1 text-xs font-medium text-primary">People also viewed</h4>
							<div class="space-y-1">
								{#each candidateData.people_also_viewed.slice(0, 1) as person (person.link)}
									<div>
										<p class="text-xs font-medium">{person.name}</p>
										<p class="truncate text-xs text-muted-foreground">
											{person.link}
										</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<div class="flex flex-col gap-1 self-start pt-1">
					<slot name="actions" />
				</div>
			</div>
		</div>
	</CardContent>
</Card>
