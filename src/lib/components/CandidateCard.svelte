<script lang="ts">
	// Assuming CandidateType is defined similarly to the page component or imported
	// For simplicity, let's redefine relevant parts here if not importing
	import type { InferSelectModel } from 'drizzle-orm';

	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import type { candidates, linkedInProfile } from '$lib/server/db/schema';

	type LinkedInProfileSelect = InferSelectModel<typeof linkedInProfile>;
	type CandidateType = InferSelectModel<typeof candidates> & {
		linkedInProfile: LinkedInProfileSelect | null;
	};

	let { candidate } = $props<{ candidate: CandidateType }>();

	function getScoreColor(score: number | null | undefined) {
		if (score === undefined || score === null) return 'bg-gray-300 dark:bg-gray-700';
		if (score >= 80) return 'bg-green-500';
		if (score >= 60) return 'bg-yellow-500';
		return 'bg-red-500';
	}
	const profile = $derived(candidate.linkedInProfile);
</script>

<Card class="overflow-hidden">
	<CardContent class="flex items-start space-x-4 p-4">
		<Avatar class="h-12 w-12">
			{#if profile?.profileImageB64}
				<AvatarImage
					src={`data:image/jpeg;base64,${profile.profileImageB64}`}
					alt={`${profile.firstName ?? ''} ${profile.lastName ?? ''}`}
				/>
			{:else if profile?.profilePicUrl}
				<AvatarImage
					src={profile.profilePicUrl}
					alt={`${profile.firstName ?? ''} ${profile.lastName ?? ''}`}
				/>
			{/if}
			<AvatarFallback>
				{(profile?.firstName ?? '?').charAt(0).toUpperCase()}
				{(profile?.lastName ?? '?').charAt(0).toUpperCase()}
			</AvatarFallback>
		</Avatar>
		<div class="flex-1 space-y-1">
			<h3 class="text-lg font-medium">
				{#if profile?.url}
					<a href={profile.url} target="_blank" rel="noopener noreferrer" class="hover:underline">
						{profile.firstName ?? ''}
						{profile.lastName ?? ''}
					</a>
				{:else}
					{profile?.firstName ?? 'Unknown'} {profile?.lastName ?? 'Candidate'}
				{/if}
			</h3>
			<p class="text-sm text-muted-foreground">
				{profile?.headline ?? 'No headline available'}
			</p>
			{#if candidate.matchScore !== null && candidate.matchScore !== undefined}
				<Badge class="{getScoreColor(candidate.matchScore)} text-xs text-white">
					Match: {candidate.matchScore}/100
				</Badge>
			{/if}
		</div>
	</CardContent>
	{#if candidate.reasoning}
		<div class="border-t px-4 py-3">
			<p class="text-xs text-muted-foreground">{candidate.reasoning}</p>
		</div>
	{/if}
</Card>
