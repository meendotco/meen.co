<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { createEventDispatcher } from 'svelte';

	let {
		currentPage,
		totalPages,
		siblingsCount = 1
	} = $props<{
		currentPage: number;
		totalPages: number;
		siblingsCount?: number;
	}>();

	const dispatch = createEventDispatcher<{
		pageChange: number;
	}>();

	function goToPage(page: number) {
		if (page < 1 || page > totalPages) return;
		dispatch('pageChange', page);
	}

	function renderPageNumbers() {
		const pages = [];

		pages.push(1);

		for (
			let i = Math.max(2, currentPage - siblingsCount);
			i <= Math.min(totalPages - 1, currentPage + siblingsCount);
			i++
		) {
			if (pages[pages.length - 1] !== i - 1) {
				pages.push(-1);
			}
			pages.push(i);
		}

		if (totalPages > 1) {
			if (pages[pages.length - 1] !== totalPages - 1) {
				pages.push(-1);
			}
			pages.push(totalPages);
		}

		return pages;
	}
</script>

{#if totalPages > 1}
	<div class="flex flex-wrap items-center justify-center gap-2">
		<Button
			variant="outline"
			size="sm"
			disabled={currentPage === 1}
			onclick={() => goToPage(currentPage - 1)}
			class="flex h-10 w-10 items-center justify-center p-0"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-4 w-4"><path d="m15 18-6-6 6-6" /></svg
			>
			<span class="sr-only">Previous</span>
		</Button>

		{#each renderPageNumbers() as pageNum}
			{#if pageNum === -1}
				<span class="px-1 text-muted-foreground">...</span>
			{:else}
				<Button
					variant={pageNum === currentPage ? 'default' : 'outline'}
					size="sm"
					onclick={() => goToPage(pageNum)}
					class="flex h-10 w-10 items-center justify-center p-0"
				>
					{pageNum}
				</Button>
			{/if}
		{/each}

		<Button
			variant="outline"
			size="sm"
			disabled={currentPage === totalPages}
			onclick={() => goToPage(currentPage + 1)}
			class="flex h-10 w-10 items-center justify-center p-0"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-4 w-4"><path d="m9 18 6-6-6-6" /></svg
			>
			<span class="sr-only">Next</span>
		</Button>
	</div>
{/if}
