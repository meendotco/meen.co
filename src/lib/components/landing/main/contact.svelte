<script lang="ts">
	import { cn } from '$lib/utils';
	import Container from '$lib/components/landing/container.svelte';
	import SectionBadge from '$lib/components/landing/section-badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';

	// Waitlist form logic from WaitList.svelte
	let isSubmitting = $state(false);
	let email = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let company = $state('');
	let message = $state('');
	let isSuccess = $state(false);
	let errorMessage = $state('');

	async function submitContactForm() {
		isSubmitting = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/waitlist', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email,
					name: `${firstName} ${lastName}`,
					company,
					message
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
		} catch (error) {
			errorMessage = 'Failed to submit. Please try again later.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div id="contact" class="flex w-full flex-col items-center justify-center py-16 md:py-24 lg:py-32">
	<Container>
		<div class="mx-auto flex max-w-2xl flex-col items-center text-center">
			<SectionBadge title="Contact" />
			<h2 class="font-heading mt-6 text-3xl font-medium !leading-snug md:text-4xl lg:text-5xl">
				Contact us.
			</h2>
			<p class="mt-6 text-center text-base text-accent-foreground/80 md:text-lg">
				Have questions or need support? Contact our dedicated team today for personalized assistance
				and expert advice. We're here to help you succeed.
			</p>
		</div>
	</Container>

	<Container>
		<div class="mx-auto mt-12 w-full max-w-2xl">
			{#if isSuccess}
				<div
					class="relative rounded-xl border border-green-500/20 bg-green-500/5 p-6 text-center text-green-500 shadow-sm backdrop-blur-sm"
					role="alert"
				>
					<p class="mb-2 text-xl font-semibold">Message sent!</p>
					<p class="text-base">Thank you for contacting us. We'll get back to you shortly.</p>
				</div>
			{:else}
				<div class="rounded-xl border border-border/10 bg-card/5 p-8 shadow-sm backdrop-blur-sm">
					{#if errorMessage}
						<div
							class="relative mb-6 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-500 shadow-sm"
							role="alert"
						>
							<p class="text-sm font-medium">{errorMessage}</p>
						</div>
					{/if}

					<form class="space-y-6" on:submit|preventDefault={submitContactForm}>
						<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div>
								<Label for="firstName" class="text-sm font-medium text-foreground/70"
									>First name</Label
								>
								<Input
									id="firstName"
									type="text"
									placeholder="Jane"
									bind:value={firstName}
									class="mt-2 w-full border-border/20 bg-transparent transition-colors focus:border-violet-500"
									required
								/>
							</div>

							<div>
								<Label for="lastName" class="text-sm font-medium text-foreground/70"
									>Last name</Label
								>
								<Input
									id="lastName"
									type="text"
									placeholder="Smith"
									bind:value={lastName}
									class="mt-2 w-full border-border/20 bg-transparent transition-colors focus:border-violet-500"
									required
								/>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div>
								<Label for="email" class="text-sm font-medium text-foreground/70">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="jane@example.com"
									bind:value={email}
									class="mt-2 w-full border-border/20 bg-transparent transition-colors focus:border-violet-500"
									required
								/>
							</div>

							<div>
								<Label for="company" class="text-sm font-medium text-foreground/70"
									>Company name</Label
								>
								<Input
									id="company"
									type="text"
									placeholder="Your company"
									bind:value={company}
									class="mt-2 w-full border-border/20 bg-transparent transition-colors focus:border-violet-500"
								/>
							</div>
						</div>

						<div>
							<Label for="message" class="text-sm font-medium text-foreground/70"
								>How can we help?</Label
							>
							<Textarea
								id="message"
								placeholder="Describe your problem"
								bind:value={message}
								class="mt-2 h-32 w-full resize-none border-border/20 bg-transparent transition-colors focus:border-violet-500"
								required
							/>
						</div>

						<div class="flex justify-end">
							<Button
								type="submit"
								disabled={isSubmitting}
								class="bg-violet-600 px-6 py-2 font-medium text-white transition-colors hover:bg-violet-700"
							>
								{isSubmitting ? 'Sending...' : 'Send message'}
							</Button>
						</div>
					</form>
				</div>
			{/if}
		</div>
	</Container>
</div>
