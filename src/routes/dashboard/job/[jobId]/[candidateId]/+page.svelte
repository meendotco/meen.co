<script lang="ts">
	import {
		ArrowLeft,
		Briefcase,
		Calendar,
		ExternalLink,
		GraduationCap,
		Linkedin,
		Mail,
		MapPin,
		Phone,
		User
	} from 'lucide-svelte';

	import { goto } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
	const { job, candidate } = data;
	const profile = $derived(candidate.linkedInProfile);

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}

	function getScoreColor(score: number | null | undefined) {
		if (score === undefined || score === null) return 'bg-gray-300 dark:bg-gray-700';
		if (score >= 80) return 'bg-green-500';
		if (score >= 60) return 'bg-yellow-500';
		return 'bg-red-500';
	}

	function backToJob() {
		goto(`/dashboard/job/${job.id}`);
	}

	function contactCandidate() {
		// TODO: Implement contact candidate
	}
</script>

<div class="container h-full max-w-7xl overflow-y-auto py-6 sm:py-10">
	<div class="mb-8 flex items-center justify-between">
		<Button variant="outline" size="sm" class="gap-1" onclick={backToJob}>
			<ArrowLeft class="h-4 w-4" />
			<span class="hidden sm:inline">Back to Job</span>
		</Button>

		<div class="flex flex-col items-end gap-4">
			<div class="flex gap-2">
				<a
					href={`https://linkedin.com/in/${profile.handle}`}
					target="_blank"
					rel="noopener noreferrer"
				>
					<Button variant="outline" size="icon" aria-label="LinkedIn Profile">
						<Linkedin class="h-4 w-4" />
					</Button>
				</a>
				<Button
					variant="outline"
					size="md"
					onclick={contactCandidate}
					aria-label="Contact Candidate"
				>
					<Mail class="h-4 w-4" />
					<span class="hidden sm:inline">Contact</span>
				</Button>
			</div>
			{#if candidate.matchScore !== null && candidate.matchScore !== undefined}
				<Badge class="{getScoreColor(candidate.matchScore)} px-3 py-1 text-white">
					Match Score: {candidate.matchScore}/100
				</Badge>
			{/if}
		</div>
	</div>

	<div class="grid gap-8 md:grid-cols-12">
		<div class="space-y-6 md:col-span-4 lg:col-span-3">
			<Card class="overflow-hidden border-none shadow-md">
				<div
					class="via-primary/3 flex flex-col items-center bg-gradient-to-b from-primary/5 to-transparent px-4 pb-4 pt-8"
				>
					<div class="relative mb-3">
						{#if profile?.profileImageB64}
							<img
								src={`data:image/jpeg;base64, ${profile.profileImageB64}`}
								alt={`${profile.data?.first_name ?? ''} ${profile.data?.last_name ?? ''}`}
								class="h-24 w-24 rounded-full border-4 border-white object-cover shadow-sm ring-2 ring-primary/10 dark:border-gray-800 dark:ring-primary/20 sm:h-32 sm:w-32"
							/>
						{:else if profile?.profilePicUrl}
							<img
								src={profile.profilePicUrl}
								alt={`${profile.data?.first_name ?? ''} ${profile.data?.last_name ?? ''}`}
								class="h-24 w-24 rounded-full border-4 border-white object-cover shadow-sm ring-2 ring-primary/10 dark:border-gray-800 dark:ring-primary/20 sm:h-32 sm:w-32"
							/>
						{:else}
							<div
								class="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-slate-100 shadow-sm ring-2 ring-primary/10 dark:border-gray-800 dark:bg-slate-800 dark:ring-primary/20 sm:h-32 sm:w-32"
							>
								<span
									class="text-3xl font-semibold text-primary/80 dark:text-primary/70 sm:text-4xl"
								>
									{(profile?.data?.first_name ?? '?').charAt(0).toUpperCase()}
									{(profile?.data?.last_name ?? '?').charAt(0).toUpperCase()}
								</span>
							</div>
						{/if}
					</div>

					<div class="mb-2 text-center">
						<h3 class="text-xl font-semibold text-foreground">
							{profile?.data?.first_name ?? 'Unknown'}
							{profile?.data?.last_name ?? 'Candidate'}
						</h3>
						{#if profile?.data?.headline}
							<p class="mt-1 text-sm font-medium text-foreground/80">{profile.data.headline}</p>
						{/if}
					</div>
				</div>

				<CardContent class="space-y-4 p-5">
					<div class="space-y-3">
						{#if profile?.data?.location}
							<div class="flex items-center gap-3 text-sm">
								<MapPin class="h-4 w-4 flex-shrink-0 text-primary" />
								<span class="text-foreground">{profile.data.location}</span>
							</div>
						{/if}

						{#if profile?.data?.email}
							<div class="flex items-center gap-3 text-sm">
								<Mail class="h-4 w-4 flex-shrink-0 text-primary" />
								<span class="truncate text-foreground">{profile.data.email}</span>
							</div>
						{/if}

						{#if profile?.data?.phone_number}
							<div class="flex items-center gap-3 text-sm">
								<Phone class="h-4 w-4 flex-shrink-0 text-primary" />
								<span class="text-foreground">{profile.data.phone_number}</span>
							</div>
						{/if}

						<div class="flex items-center gap-3 text-sm">
							<Calendar class="h-4 w-4 flex-shrink-0 text-primary" />
							<span class="text-foreground">Added {formatDate(candidate.createdAt)}</span>
						</div>
					</div>

					{#if profile?.url}
						<div class="pt-2">
							<Button variant="outline" size="sm" class="w-full">
								<a
									href={profile.url}
									target="_blank"
									rel="noopener noreferrer"
									class="flex w-full items-center justify-center"
								>
									View LinkedIn Profile
									<ExternalLink class="ml-2 h-4 w-4" />
								</a>
							</Button>
						</div>
					{/if}
				</CardContent>
			</Card>

			{#if profile?.data?.skills && profile.data.skills.length > 0}
				<Card class="border-none shadow-md">
					<CardHeader class="pb-3">
						<CardTitle class="flex items-center gap-2 text-base font-medium text-foreground">
							<User class="h-4 w-4 text-primary" />
							Skills
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-wrap gap-2">
							{#each profile.data.skills as skill, i (i)}
								<Badge
									variant="outline"
									class="border-primary/20 bg-primary/5 px-3 py-1.5 text-sm text-foreground hover:border-primary/30 hover:bg-primary/10"
								>
									{skill}
								</Badge>
							{/each}
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>

		<!-- Candidate Details -->
		<div class="space-y-8 md:col-span-8 lg:col-span-9">
			<!-- Job Match Info -->
			<Card class="border-none shadow-md">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<span>Match for: {job.title}</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{#if candidate.reasoning}
						<div class="prose prose-sm max-w-none">
							<h4 class="mb-3 text-base font-medium text-foreground">Match Assessment</h4>
							<div
								class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
							>
								<p class="whitespace-pre-line text-sm text-foreground/90">{candidate.reasoning}</p>
							</div>
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Experience -->
			{#if profile?.data?.experiences && profile.data.experiences.length > 0}
				<Card class="border-none shadow-md">
					<CardHeader class="pb-2">
						<CardTitle class="flex items-center gap-2">
							<Briefcase class="h-5 w-5" />
							Experience
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-6">
							{#each profile.data.experiences as exp, i (i)}
								<div
									class={i !== profile.data.experiences.length - 1
										? 'ml-2 border-l-2 border-slate-200 pb-2 pl-4 dark:border-slate-700'
										: 'ml-2 pl-4'}
								>
									<div class="relative">
										<div
											class={i !== profile.data.experiences.length - 1
												? 'absolute -left-[1.25rem] -top-1 h-4 w-4 rounded-full bg-muted ring-4 ring-white dark:bg-muted dark:ring-black'
												: 'absolute -left-[1.25rem] -top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-white dark:bg-primary dark:ring-black'}
										></div>
										<div class="flex items-baseline justify-between gap-2">
											<h4 class="text-base font-medium text-foreground">{exp.title}</h4>
											<div
												class="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs text-foreground/80 dark:bg-muted/70 sm:text-sm"
											>
												{exp.starts_at ? `${exp.starts_at.year}` : ''} -
												{exp.ends_at ? exp.ends_at.year : 'Present'}
											</div>
										</div>
										<p class="text-sm font-medium text-primary">{exp.company}</p>
										{#if exp.description}
											<p class="mt-2 whitespace-pre-line text-sm text-foreground/80">
												{exp.description}
											</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			{/if}

			<!-- Education -->
			{#if profile?.data?.education && profile.data.education.length > 0}
				<Card class="border-none shadow-md">
					<CardHeader class="pb-2">
						<CardTitle class="flex items-center gap-2">
							<GraduationCap class="h-5 w-5" />
							Education
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-6">
							{#each profile.data.education as edu, i (i)}
								<div
									class={i !== profile.data.education.length - 1
										? 'ml-2 border-l-2 border-slate-200 pb-2 pl-4 dark:border-slate-700'
										: 'ml-2 pl-4'}
								>
									<div class="relative">
										<div
											class={i !== profile.data.education.length - 1
												? 'absolute -left-[1.25rem] -top-1 h-4 w-4 rounded-full bg-muted ring-4 ring-white dark:bg-muted dark:ring-black'
												: 'absolute -left-[1.25rem] -top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-white dark:bg-primary dark:ring-black'}
										></div>
										<h4 class="text-base font-medium text-foreground">{edu.school}</h4>
										<p class="text-sm text-primary">
											{edu.degree_name ? `${edu.degree_name}, ` : ''}
											{edu.field_of_study || ''}
										</p>
										<div
											class="mt-1 inline-flex rounded-md bg-muted px-2 py-0.5 text-xs text-foreground/80 dark:bg-muted/70"
										>
											{edu.starts_at ? `${edu.starts_at.year}` : ''} -
											{edu.ends_at ? edu.ends_at.year : 'Present'}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>
	</div>
</div>
