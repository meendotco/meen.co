<script lang="ts">
	import {
		Briefcase,
		Calendar,
		DollarSign,
		Globe,
		LinkedinIcon,
		MapPin,
		Loader2,
		CheckCircle,
		GraduationCap,
		ChevronLeft
	} from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';
	import { fade, fly } from 'svelte/transition';

	// Props and derived values
	let { data } = $props();
	const post = $derived(data.post);
	const themeColor = $derived(data.orgData?.theme);

	// Interfaces
	interface AssessmentData {
		matchScore: number;
		reasoning: string;
		handle: string;
		linkedinProfile: Record<string, any>;
	}

	// Component state
	let assessmentData = $state<AssessmentData | null>(null);
	let linkedinUrl = $state('');
	let profileData = $state<Record<string, any> | null>(null);
	let isLoading = $state(false);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let submissionSuccess = $state(false);
	let currentStep = $state<'input' | 'preview' | 'success'>('input');

	// Methods
	async function importProfile() {
		if (!linkedinUrl || !linkedinUrl.includes('linkedin.com/in/')) {
			error = 'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/...).';
			return;
		}

		isLoading = true;
		error = null;
		profileData = null;
		submissionSuccess = false;

		const importToastId = toast.loading('Importing profile...', { duration: Infinity });

		try {
			const response = await fetch(`/api/job/${post?.id}/profile`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ linkedinUrl })
			});

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ message: 'Failed to fetch profile details.' }));

				if (errorData.error === 'Already applied') {
					toast.error('You have already applied for this position.', { id: importToastId });
					throw new Error('You have already applied for this position.');
				}

				const errorMessage =
					errorData.error || errorData.message || 'Server error during profile import.';
				toast.error(errorMessage, { id: importToastId });
				throw new Error(errorMessage);
			}
			const result = await response.json();

			assessmentData = result.assessment;
			profileData = result?.assessment?.linkedinProfile;
			toast.success('Profile imported successfully!', { id: importToastId });
			currentStep = 'preview';
		} catch (err: any) {
			error = err.message || 'An error occurred while importing the profile.';
			console.error('Profile import error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function submitApplication() {
		if (!profileData || !post?.id) {
			toast.error('Cannot submit application without profile data or job ID.');
			return;
		}

		isSubmitting = true;
		error = null;
		submissionSuccess = false;

		const submitToastId = toast.loading('Submitting application...', { duration: Infinity });

		try {
			const response = await fetch(`/api/job/${post?.id}/apply`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					linkedinHandle: assessmentData?.handle,
					matchScore: assessmentData?.matchScore,
					reasoning: assessmentData?.reasoning
				})
			});

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ message: 'Failed to submit application.' }));
				const errorMessage = errorData.message || 'Server error during application submission.';
				toast.error(errorMessage, { id: submitToastId });
				throw new Error(errorMessage);
			}

			await response.json();
			submissionSuccess = true;
			currentStep = 'success';
			toast.success('Application submitted successfully!', { id: submitToastId });
		} catch (err: any) {
			error = err.message || 'An error occurred while submitting the application.';
			console.error('Application submission error:', err);
		} finally {
			isSubmitting = false;
		}
	}

	function formatDate(date: Date | string | null | undefined) {
		if (!date) return 'Date not specified';
		return new Date(date).toLocaleDateString('en-US', {
			month: 'numeric',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="mx-auto flex w-full max-w-5xl flex-col space-y-8 px-4 py-6 sm:px-6 md:px-8 lg:py-8">
	<!-- Header -->
	<div class="flex flex-col space-y-4">
		<div>
			<Button
				variant="outline"
				size="sm"
				class="flex items-center gap-2 text-sm transition-colors hover:text-accent-foreground/80"
				onclick={() => history.back()}
			>
				<ChevronLeft class="h-4 w-4" />
				<span>Back</span>
			</Button>
		</div>
		<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{post?.title}</h1>
		<p class="text-muted-foreground">{post?.department || 'Job Details'}</p>
	</div>

	<!-- Main Content -->
	<div
		class="relative flex flex-col rounded-xl border bg-card p-6 shadow-sm dark:bg-card/95 sm:p-8"
	>
		<!-- Job Metadata -->
		<div class="mb-6">
			<div class="mb-4 flex flex-wrap gap-2 text-xs">
				{#if post?.location}
					<span
						class="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 dark:bg-muted/70"
					>
						<MapPin class="h-3 w-3" />
						<span>{post.location}</span>
					</span>
				{/if}
				{#if post?.type}
					<span
						class="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 dark:bg-muted/70"
					>
						<Briefcase class="h-3 w-3" />
						<span>{post.type}</span>
					</span>
				{/if}
				{#if post?.remote_policy}
					<span
						class="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 dark:bg-muted/70"
					>
						<Globe class="h-3 w-3" />
						<span>{post.remote_policy}</span>
					</span>
				{/if}
				{#if post?.salary}
					<span
						class="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 dark:bg-muted/70"
					>
						<DollarSign class="h-3 w-3" />
						<span>{post.salary}</span>
					</span>
				{/if}
			</div>

			<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Calendar class="h-3 w-3" />
				<span>Posted {formatDate(post?.createdAt)}</span>
			</div>
		</div>

		<!-- Job Description Sections -->
		<hr class="mb-6 border-border/40 dark:border-border/20" />

		{#if post?.description}
			<section class="mb-6">
				<h2 class="mb-3 text-base font-medium sm:text-lg">Description</h2>
				<p class="text-sm text-muted-foreground">{post.description}</p>
			</section>
		{/if}

		{#if post?.responsibilities}
			<section class="mb-6">
				<h2 class="mb-3 text-base font-medium sm:text-lg">Responsibilities</h2>
				<p class="text-sm text-muted-foreground">{post.responsibilities}</p>
			</section>
		{/if}

		{#if post?.requirements}
			<section class="mb-6">
				<h2 class="mb-3 text-base font-medium sm:text-lg">Requirements</h2>
				<p class="text-sm text-muted-foreground">{post.requirements}</p>
			</section>
		{/if}

		{#if post?.benefits}
			<section class="mb-6">
				<h2 class="mb-3 text-base font-medium sm:text-lg">Benefits</h2>
				<p class="text-sm text-muted-foreground">{post.benefits}</p>
			</section>
		{/if}

		{#if post?.tech_stack && typeof post.tech_stack === 'string'}
			<section class="mb-6">
				<h2 class="mb-3 text-base font-medium sm:text-lg">Tech Stack</h2>
				<p class="text-sm text-muted-foreground">{post.tech_stack}</p>
			</section>
		{/if}

		<hr class="mb-6 border-border/40 dark:border-border/20" />

		<!-- Application Section -->
		<div class="mt-auto">
			{#if data.user && data.user.organizationHandle === post?.ownerOrganizationHandle}
				<!-- Owner View -->
				<div class="rounded-lg bg-muted/60 p-4 dark:bg-muted/20">
					<div class="mb-3 flex items-center gap-2">
						<svg
							class="h-5 w-5 text-muted-foreground"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
						</svg>
						<p class="text-sm font-medium">You're the owner of this job post</p>
					</div>
					<Button
						href={`/dashboard/job/${post?.id}`}
						style={themeColor ? `background-color: ${themeColor}` : ''}
						variant="default"
						size="sm"
						class="transition-all hover:opacity-90"
					>
						See Applicants
					</Button>
				</div>
			{:else}
				<!-- Application Process -->
				{#if currentStep === 'input'}
					<!-- Step 1: Enter LinkedIn URL -->
					<div
						class="rounded-lg border border-border/50 bg-card/95 p-5 shadow-sm dark:bg-card/30"
						in:fade={{ duration: 300 }}
					>
						<div class="mb-4 flex items-center gap-2">
							<LinkedinIcon class="h-5 w-5 text-blue-600" />
							<h3 class="text-base font-medium">Apply with LinkedIn</h3>
						</div>

						<p class="mb-4 text-sm text-muted-foreground">
							Enter your LinkedIn profile URL to apply for this position quickly.
						</p>

						<div class="space-y-4">
							<div class="flex flex-col space-y-2">
								<label for="linkedin-url" class="text-sm font-medium">LinkedIn Profile URL</label>
								<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
									<Input
										id="linkedin-url"
										type="url"
										placeholder="https://linkedin.com/in/your-profile"
										bind:value={linkedinUrl}
										disabled={isLoading}
										class="flex-grow focus-visible:ring-transparent"
									/>
									<Button
										onclick={importProfile}
										disabled={isLoading || !linkedinUrl}
										style={themeColor ? `background-color: ${themeColor}` : ''}
										class="relative shrink-0 whitespace-nowrap transition-opacity hover:opacity-90"
									>
										{#if isLoading}
											<Loader2 class="mr-2 h-4 w-4 animate-spin" />
											Importing...
										{:else}
											Import Profile
										{/if}
									</Button>
								</div>
								{#if error}
									<p class="mt-1 text-sm text-destructive">{error}</p>
								{/if}
							</div>
						</div>
					</div>
				{:else if currentStep === 'preview' && profileData}
					<!-- Step 2: Review Profile -->
					<div
						class="rounded-lg border border-border/50 bg-card/95 p-5 shadow-sm dark:bg-card/30"
						in:fly={{ y: 20, duration: 300 }}
					>
						<div class="mb-5 flex items-center gap-2">
							<LinkedinIcon class="h-5 w-5 text-blue-600" />
							<h3 class="text-base font-medium">Profile Details</h3>
						</div>

						<!-- Basic Info -->
						<div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label for="preview-name" class="text-xs font-medium text-muted-foreground"
									>Full Name</label
								>
								<Input
									id="preview-name"
									value={profileData.full_name}
									disabled
									class="mt-1 bg-muted/30 dark:bg-[#1A1A1A]"
								/>
							</div>
							<div>
								<label for="preview-headline" class="text-xs font-medium text-muted-foreground"
									>Current Position</label
								>
								<Input
									id="preview-headline"
									value={profileData.headline}
									disabled
									class="mt-1 bg-muted/30 dark:bg-[#1A1A1A]"
								/>
							</div>
							<div>
								<label for="preview-location" class="text-xs font-medium text-muted-foreground"
									>Location</label
								>
								<Input
									id="preview-location"
									value={profileData.city +
										', ' +
										profileData.state +
										', ' +
										profileData.country_full_name}
									disabled
									class="mt-1 bg-muted/30 dark:bg-[#1A1A1A]"
								/>
							</div>
							<div>
								<label for="preview-connections" class="text-xs font-medium text-muted-foreground"
									>Network</label
								>
								<Input
									id="preview-connections"
									value={profileData.connections
										? `${profileData.connections} connections`
										: 'Not available'}
									disabled
									class="mt-1 bg-muted/30 dark:bg-[#1A1A1A]"
								/>
							</div>
							<div class="sm:col-span-2">
								<label for="preview-summary" class="text-xs font-medium text-muted-foreground"
									>Summary</label
								>
								<Input
									id="preview-summary"
									value={profileData.summary ?? 'N/A'}
									disabled
									class="mt-1 h-20 resize-none bg-muted/30 dark:bg-[#1A1A1A]"
								/>
							</div>
						</div>

						<!-- Education -->
						{#if profileData.education && profileData.education.length > 0}
							<div class="mb-5">
								<div class="mb-3 flex items-center gap-2">
									<GraduationCap class="h-4 w-4 text-muted-foreground" />
									<label class="text-xs font-medium text-muted-foreground">Education</label>
								</div>
								<div class="space-y-2">
									{#each profileData.education as edu}
										<div
											class="rounded-md border border-border/40 bg-muted/20 p-2.5 dark:bg-[#1A1A1A]/50"
										>
											<div class="flex items-center justify-between">
												<span class="text-sm font-medium">{edu.school}</span>
												{#if edu.starts_at && edu.ends_at}
													<span class="text-xs text-muted-foreground">
														{edu.starts_at.year} - {edu.ends_at.year}
													</span>
												{/if}
											</div>
											{#if edu.degree_name || edu.field_of_study}
												<p class="text-xs text-muted-foreground">
													{edu.degree_name || ''}{edu.field_of_study
														? ` in ${edu.field_of_study}`
														: ''}
												</p>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Languages -->
						{#if profileData.languages && profileData.languages.length > 0}
							<div class="mb-5">
								<div class="mb-3 flex items-center gap-2">
									<Globe class="h-4 w-4 text-muted-foreground" />
									<label class="text-xs font-medium text-muted-foreground">Languages</label>
								</div>
								<div class="flex flex-wrap gap-2">
									{#each profileData.languages as language}
										<div
											class="inline-flex items-center rounded-full bg-muted/40 px-3 py-1 text-xs dark:bg-[#1A1A1A]/80"
										>
											{language}
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Skills -->
						{#if profileData.skills && profileData.skills.length > 0}
							<div class="mb-5">
								<div class="mb-3 flex items-center gap-2">
									<svg
										class="h-4 w-4 text-muted-foreground"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path
											d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
										/>
									</svg>
									<label class="text-xs font-medium text-muted-foreground">Skills</label>
								</div>
								<div class="flex flex-wrap gap-1.5">
									{#each profileData.skills.slice(0, 10) as skill}
										<span
											class="inline-flex rounded-md bg-muted/50 px-2.5 py-1.5 text-xs dark:bg-[#27272A]/70"
										>
											{skill}
										</span>
									{/each}
									{#if profileData.skills.length > 10}
										<span
											class="inline-flex rounded-md bg-muted/50 px-2.5 py-1.5 text-xs dark:bg-[#27272A]/70"
										>
											+{profileData.skills.length - 10} more
										</span>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Actions -->
						<div class="mt-6 flex flex-col gap-3 sm:flex-row">
							<Button onclick={() => (currentStep = 'input')} variant="outline" class="flex-1">
								Change Profile
							</Button>
							<Button
								onclick={submitApplication}
								disabled={isSubmitting}
								style={themeColor ? `background-color: ${themeColor}` : ''}
								class="flex-1 transition-opacity hover:opacity-90"
							>
								{#if isSubmitting}
									<Loader2 class="mr-2 h-4 w-4 animate-spin" />
									Submitting...
								{:else}
									Submit Application
								{/if}
							</Button>
						</div>

						{#if error && !isSubmitting}
							<p class="mt-3 text-sm text-destructive">{error}</p>
						{/if}
					</div>
				{:else if currentStep === 'success'}
					<!-- Step 3: Success -->
					<div
						class="rounded-lg border border-green-500/30 bg-green-50/20 p-6 dark:border-green-700/20 dark:bg-green-900/10"
						in:fly={{ y: 20, duration: 300 }}
					>
						<div class="flex flex-col items-center justify-center gap-4 text-center">
							<div
								class="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
							>
								<CheckCircle class="h-7 w-7 text-green-600 dark:text-green-400" />
							</div>
							<div>
								<h3 class="text-xl font-medium text-green-700 dark:text-green-400">
									Application Submitted!
								</h3>
								<p class="mt-2 text-sm text-green-600/80 dark:text-green-400/80">
									Your application for {post?.title} has been successfully submitted.
								</p>
							</div>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
