<script lang="ts">
	import { BriefcaseBusiness, Search } from '@lucide/svelte';

	import { page } from '$app/state';

	import Logo from './Logo.svelte';
	import UserMenu from './UserMenu.svelte';
	let { user } = $props();
</script>

<aside
	class="bg-sidebar-background fixed inset-y-0 left-0 z-30 hidden w-14 flex-col border-r border-white/10 bg-gradient-to-b from-background via-background to-background/90 px-2 lg:flex"
>
	<div class="mt-2">
		<Logo />
	</div>
	<nav class="flex flex-col items-center gap-4 pt-6">
		<a
			href="/dashboard/job-post/create"
			class="group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all {page.url.pathname.startsWith(
				'/dashboard/job-post/create'
			)
				? 'bg-primary/20 text-primary'
				: 'text-sidebar-foreground hover:text-primary'}"
			aria-label="Create Job Post"
		>
			<div
				class="absolute -inset-1 rounded-lg bg-primary/20 opacity-0 blur-sm transition-opacity group-hover:opacity-100"
			></div>
			<BriefcaseBusiness class="relative z-10 h-5 w-5" />
		</a>
		<a
			href="/dashboard/candidates"
			class="group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all {page.url.pathname.startsWith(
				'/dashboard/candidates'
			)
				? 'bg-primary/20 text-primary'
				: 'text-sidebar-foreground hover:text-primary'}"
			aria-label="Search Candidates"
		>
			<div
				class="absolute -inset-1 rounded-lg bg-primary/20 opacity-0 blur-sm transition-opacity group-hover:opacity-100"
			></div>
			<Search class="relative z-10 h-5 w-5" />
		</a>
	</nav>
	<div class="mt-auto pb-4">
		<UserMenu {user} />
	</div>
</aside>
