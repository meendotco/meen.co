<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';
	import { CheckCircle, LoaderCircle, TriangleAlert } from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import type { toolcall as ToolcallSchema } from '$lib/server/db/schema';

	type ToolcallSelect = InferSelectModel<typeof ToolcallSchema>;

	let { toolcall: toolCallProp } = $props<{
		toolcall: ToolcallSelect;
	}>();

	const status = $derived(() => {
		if (toolCallProp.result !== undefined && toolCallProp.result !== null) {
			return 'success';
		}
		// Simplified: Assume error if result is explicitly null, otherwise pending.
		// This might need refinement if the backend provides more status info.
		if (toolCallProp.result === null) {
			return 'error';
		}
		return 'pending';
	});

	// Helper to safely get args
	function getArg(key: string): boolean | number | string | null | undefined {
		return toolCallProp.args?.[key];
	}
</script>

<div
	class="my-1 flex items-center gap-2 rounded border bg-muted/50 p-2 text-xs text-muted-foreground shadow-sm"
>
	{#if status() === 'success'}
		<CheckCircle class="h-4 w-4 flex-shrink-0 text-green-500" />
	{:else if status() === 'pending'}
		<LoaderCircle class="h-4 w-4 flex-shrink-0 animate-spin text-muted-foreground" />
	{:else if status() === 'error'}
		<TriangleAlert class="h-4 w-4 flex-shrink-0 text-destructive" />
	{/if}

	<div class="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
		<span class="font-medium">Tool:</span>
		<Badge variant="secondary" class="font-mono">{toolCallProp.name}</Badge>

		{#if toolCallProp.name === 'addCandidate'}
			{#if getArg('handle')}
				<span class="truncate">handle: {getArg('handle')}</span>
			{/if}
			{#if getArg('score') !== undefined}
				<span class="truncate">score: {getArg('score')}</span>
			{/if}
		{:else if toolCallProp.name === 'searchInternet'}
			{#if getArg('query')}
				<span class="truncate">query: "{getArg('query')}"</span>
			{/if}
		{:else if toolCallProp.name === 'fetchLinkedinProfile'}
			{#if getArg('profile_url')}
				<span class="truncate">url: {getArg('profile_url')}</span>
			{/if}
		{:else}
			<!-- Generic fallback for other tools - maybe show arg count? -->
			{#if toolCallProp.args && Object.keys(toolCallProp.args).length > 0}
				<span>({Object.keys(toolCallProp.args).length} args)</span>
			{/if}
		{/if}

		{#if status() === 'success' && toolCallProp.result !== true}
			<!-- Optionally show simple result if not just 'true' -->
			<!-- <span class="ml-auto font-mono text-[10px]">{JSON.stringify(toolCallProp.result)}</span> -->
		{/if}
	</div>
</div>
