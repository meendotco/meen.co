<script lang="ts">
	import { SignIn } from '@auth/sveltekit/components';
	import { Linkedin } from '@lucide/svelte';

	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
</script>

<div
	class="container mx-auto flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center py-10"
>
	<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
		<div class="flex flex-col space-y-2 text-center">
			<h1 class="text-2xl font-semibold tracking-tight">Welcome back</h1>
			<p class="text-sm text-muted-foreground">Sign in to your account to continue</p>
		</div>

		<Card>
			<CardContent class="pt-6">
				<div class="grid gap-2">
					<Button variant="outline" class="flex items-center gap-2">
						<Linkedin class="h-4 w-4" />
						<SignIn provider="linkedin" signInPage="signin" />
					</Button>
				</div>
			</CardContent>
		</Card>

		<p class="px-8 text-center text-sm text-muted-foreground">
			By clicking continue, you agree to our
			<a href="/privacy" class="underline underline-offset-4 hover:text-primary">Privacy Policy</a>.
		</p>
	</div>
</div>
