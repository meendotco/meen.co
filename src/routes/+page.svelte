<script lang="ts">
	import Input from '@/components/ui/input/input.svelte';
	import { page } from '$app/state';
	import Logo from '$lib/components/Logo.svelte';
	import { Button } from '$lib/components/ui/button';
	import SectionBadge from '$lib/components/landing/section-badge.svelte';
	import Features from '@/components/landing/main/features.svelte';
	import Hero from '@/components/landing/main/hero.svelte';
	import Container from '$lib/components/landing/container.svelte';
	import Solution from '@/components/landing/main/solution.svelte';
	import Contact from '@/components/landing/main/contact.svelte';
	let { data } = $props();
	let jobPostUrl = $state('');
</script>

<section
	class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background py-10"
>
	<div class="relative mx-auto size-full max-w-6xl px-4 py-20 md:px-12">
		<Hero />
		<Features />
		<Solution />
		<Contact />
	</div>
</section>
