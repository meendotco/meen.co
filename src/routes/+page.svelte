<script lang="ts">
	import Contact from '@/components/landing/main/contact.svelte';
	import Features from '@/components/landing/main/features.svelte';
	import Hero from '@/components/landing/main/hero.svelte';
	import Search from '@/components/landing/main/search.svelte';
</script>

<section
	class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background py-10"
>
	<div class="relative mx-auto size-full max-w-6xl px-4 py-20 md:px-12">
		<Hero />
		<Search />
		<Features />
		<Contact />
	</div>
</section>
