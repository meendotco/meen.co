<script lang="ts">
	// Assuming CandidateType is defined similarly to the page component or imported
	// For simplicity, let's redefine relevant parts here if not importing
	import type { InferSelectModel } from 'drizzle-orm';
	import { goto } from '$app/navigation';

	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { ArrowUpRight } from 'lucide-svelte';
	import type { candidates, linkedInProfile } from '$lib/server/db/schema';
	type LinkedInProfileSelect = InferSelectModel<typeof linkedInProfile>;
	type CandidateType = InferSelectModel<typeof candidates> & {
		linkedInProfile: LinkedInProfileSelect | null;
	};

	let { candidate, jobId } = $props<{
		candidate: CandidateType;
		jobId?: string;
	}>();

	function getScoreColor(score: number | null | undefined) {
		if (score === undefined || score === null) return 'bg-gray-300 dark:bg-gray-700';
		if (score >= 80) return 'bg-green-500';
		if (score >= 60) return 'bg-yellow-500';
		return 'bg-red-500';
	}
	const profile = $derived(candidate.linkedInProfile);

	function navigateToCandidate() {
		if (jobId) {
			goto(`/dashboard/job/${jobId}/${candidate.id}`);
		}
	}
</script>

<Card
	class="group relative overflow-hidden border border-muted/60 bg-card/90 transition-all hover:border-muted hover:bg-card"
	onclick={navigateToCandidate}
	tabindex="0"
	role="button"
>
	<div class="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
		<Badge variant="outline" class="gap-1 text-xs font-normal text-muted-foreground">
			View <ArrowUpRight size={12} />
		</Badge>
	</div>

	<CardContent class="p-5">
		<div class="flex items-start gap-4">
			<div
				class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/30 bg-muted"
			>
				{#if profile?.profileImageB64}
					<img
						src={`data:image/jpeg;base64, ${profile.profileImageB64}`}
						alt={`${profile.data?.first_name ?? ''} ${profile.data?.last_name ?? ''}`}
						class="h-full w-full object-cover"
					/>
				{:else if profile?.profilePicUrl}
					<img
						src={profile.profilePicUrl}
						alt={`${profile.data?.first_name ?? ''} ${profile.data?.last_name ?? ''}`}
						class="h-full w-full object-cover"
					/>
				{:else}
					<span class="text-sm font-medium text-muted-foreground">
						{(profile?.data?.first_name ?? '?').charAt(0).toUpperCase()}
						{(profile?.data?.last_name ?? '?').charAt(0).toUpperCase()}
					</span>
				{/if}
			</div>
			<div class="flex-1 space-y-1">
				<div class="flex items-center gap-2">
					<h3 class="text-sm font-medium">
						{#if profile?.url}
							<a
								href={profile.url}
								target="_blank"
								rel="noopener noreferrer"
								class="text-foreground hover:underline"
							>
								{profile?.data?.first_name ?? ''}
								{profile?.data?.last_name ?? ''}
							</a>
						{:else}
							{profile?.data?.first_name ?? 'Unknown'} {profile?.data?.last_name ?? 'Candidate'}
						{/if}
					</h3>
					{#if candidate.matchScore !== null && candidate.matchScore !== undefined}
						<Badge class="{getScoreColor(candidate.matchScore)} h-5 px-1.5 text-[10px] text-white">
							{candidate.matchScore}/100
						</Badge>
					{/if}
				</div>
				<p class="text-xs text-muted-foreground">
					{#if profile?.data?.headline}
						{#if profile.data.headline.length > 34}
							{profile.data.headline.slice(0, 34)}...
						{:else}
							{profile.data.headline}
						{/if}
					{:else}
						No headline available
					{/if}
				</p>
			</div>
		</div>

		{#if candidate.reasoning}
			<div class="mt-4 rounded border border-border/30 bg-muted/20 p-3">
				<p class="text-xs leading-relaxed text-muted-foreground">
					{#if candidate.reasoning.length > 210}
						{candidate.reasoning.slice(0, 210)}...
					{:else}
						{candidate.reasoning}
					{/if}
				</p>
			</div>
		{/if}
	</CardContent>
</Card>
