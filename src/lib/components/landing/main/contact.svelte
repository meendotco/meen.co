<script lang="ts">
	import Container from '$lib/components/landing/container.svelte';
	import RetroGrid from '$lib/components/landing/retro-grid.svelte';
	import SectionBadge from '$lib/components/landing/section-badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';

	// Waitlist form logic
	let isSubmitting = $state(false);
	let email = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let company = $state('');
	let message = $state('');
	let isSuccess = $state(false);
	let errorMessage = $state('');

	async function submitWaitlistForm() {
		isSubmitting = true;
		errorMessage = '';

		try {
			const response = await fetch('/waitlist', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email,
					name: `${firstName} ${lastName}`,
					company,
					role: message // Using message as role since the API expects role
				})
			});

			if (response.ok) {
				isSuccess = true;
				email = '';
				firstName = '';
				lastName = '';
				company = '';
				message = '';
			} else {
				const data = await response.json();
				errorMessage = data.message || 'Something went wrong. Please try again.';
			}
		} catch {
			errorMessage = 'Failed to submit. Please try again later.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div id="contact" class="mt-24"></div>

<div class="relative flex w-full flex-col items-center justify-center py-12 md:py-16 lg:py-24">
	<Container>
		<div
			class="relative mx-auto flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl px-4 text-center md:px-0"
		>
			<div
				class="absolute bottom-0 left-1/2 h-12 w-full -translate-x-1/2 bg-violet-500 blur-[10rem] dark:opacity-80"
			></div>
			<div class="z-20 flex w-full flex-col items-center justify-center pt-12 md:pt-16">
				<SectionBadge title="Join Waitlist" />
				<h2 class="font-heading mt-6 text-2xl font-medium !leading-snug md:text-4xl lg:text-5xl">
					Get access to <span class="text-violet-500 dark:text-violet-400">Meen</span>
				</h2>
				<p class="mx-auto mt-6 max-w-xl text-center text-base text-muted-foreground md:text-lg">
					We are currently rolling out to select users. Fill out the form below and we'll send you a
					personal demo.
				</p>

				<div class="mx-auto mt-12 w-full max-w-2xl pb-12 md:pb-16">
					{#if isSuccess}
						<div
							class="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-violet-600/5 p-8 text-center shadow-lg backdrop-blur-sm dark:from-violet-500/20 dark:to-violet-600/10"
							role="alert"
						>
							<div
								class="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-400/20 blur-xl dark:bg-violet-400/30"
							/>
							<div class="relative z-10">
								<div
									class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20 dark:bg-violet-500/30"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-8 w-8 text-violet-500 dark:text-violet-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</div>
								<p class="mb-2 text-2xl font-semibold text-violet-500 dark:text-violet-400">
									You're on the list!
								</p>
								<p class="text-base text-violet-500/80 dark:text-violet-400/90">
									Thanks for joining our waitlist. We'll notify you when we launch.
								</p>
							</div>
						</div>
					{:else}
						<div
							class="overflow-hidden rounded-xl border border-border/20 bg-gradient-to-br from-card/10 to-card/5 p-8 shadow-lg backdrop-blur-sm dark:border-border/30 dark:from-card/20 dark:to-card/10"
						>
							{#if errorMessage}
								<div
									class="relative mb-6 overflow-hidden rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-500 shadow-sm dark:border-red-500/30 dark:bg-red-500/10"
									role="alert"
								>
									<div
										class="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-red-400/20 blur-xl dark:bg-red-400/30"
									/>
									<p class="relative z-10 text-sm font-medium">{errorMessage}</p>
								</div>
							{/if}

							<form class="space-y-6" on:submit|preventDefault={submitWaitlistForm}>
								<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
									<div class="group">
										<label
											for="firstName"
											class="block text-left text-sm font-medium text-foreground/70 dark:text-foreground/80"
											>First name</label
										>
										<Input
											id="firstName"
											type="text"
											placeholder="Jane"
											bind:value={firstName}
											class="mt-2 w-full border-border/80 bg-background/50 outline-none transition-all focus-visible:ring-transparent dark:border-border/20 dark:border-border/30 dark:bg-background/30"
											required
										/>
									</div>

									<div class="group">
										<label
											for="lastName"
											class="block text-left text-sm font-medium text-foreground/70 dark:text-foreground/80"
											>Last name</label
										>
										<Input
											id="lastName"
											type="text"
											placeholder="Smith"
											bind:value={lastName}
											class="mt-2 w-full border-border/80 bg-background/50 outline-none transition-all focus-visible:ring-transparent dark:border-border/20 dark:border-border/30 dark:bg-background/30"
											required
										/>
									</div>
								</div>

								<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
									<div class="group">
										<label
											for="email"
											class="block text-left text-sm font-medium text-foreground/70 dark:text-foreground/80"
											>Email</label
										>
										<Input
											id="email"
											type="email"
											placeholder="jane@example.com"
											bind:value={email}
											class="mt-2 w-full border-border/80 bg-background/50 outline-none transition-all focus-visible:ring-transparent dark:border-border/20 dark:border-border/30 dark:bg-background/30"
											required
										/>
									</div>

									<div class="group">
										<label
											for="company"
											class="block text-left text-sm font-medium text-foreground/70 dark:text-foreground/80"
											>Company name</label
										>
										<Input
											id="company"
											type="text"
											placeholder="Your company"
											bind:value={company}
											class="mt-2 w-full border-border/80 bg-background/50 outline-none transition-all focus-visible:ring-transparent dark:border-border/20 dark:border-border/30 dark:bg-background/30"
										/>
									</div>
								</div>

								<div class="group">
									<label
										for="message"
										class="block text-left text-sm font-medium text-foreground/70 dark:text-foreground/80"
										>Why are you interested?</label
									>
									<Textarea
										id="message"
										placeholder="Tell us what you're looking for"
										bind:value={message}
										class="mt-2 h-28 w-full resize-none border-border/80 bg-background/50 outline-none transition-all focus-visible:ring-transparent dark:border-border/20 dark:border-border/30 dark:bg-background/30"
									/>
								</div>

								<div class="flex items-center justify-between gap-4">
									<p class="text-xs text-muted-foreground">
										Note: this data is not shared with anyone and is stored on EU servers.
									</p>
									<Button
										type="submit"
										disabled={isSubmitting}
										class="relative overflow-hidden bg-gradient-to-br from-violet-600 to-violet-700 px-6 py-2.5 font-medium text-white transition-all hover:shadow-lg dark:from-violet-500 dark:to-violet-600"
									>
										<span class="relative z-10"
											>{isSubmitting ? 'Joining...' : 'Join Waitlist'}</span
										>
										<div
											class="absolute inset-0 h-full w-full transition-all group-hover:bg-violet-800/20 dark:group-hover:bg-violet-700/20"
										/>
									</Button>
								</div>
							</form>
						</div>
					{/if}
				</div>
			</div>
			<RetroGrid />
		</div>
	</Container>
</div>
