<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';
	import { CheckCircle, ChevronRight, LoaderCircle } from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import { type toolcall as ToolcallSchema } from '$lib/server/db/schema';
	type ToolcallSelect = InferSelectModel<typeof ToolcallSchema>;

	let { toolcall: toolCallProp, chunks } = $props<{
		toolcall:
			| ToolcallSelect
			| {
					args: Record<string, unknown>;
					type: string;
					toolName: string;
					toolCallId: string;
			  };
		chunks: [];
	}>();

	let expanded = $state(false);
	const currentToolCallId = $state(toolCallProp.toolCallId);

	const status = $derived(() => {
		for (const chunk of chunks) {
			if (chunk.chunk.toolCallId === currentToolCallId && chunk.chunk.type === 'tool-result') {
				return 'success';
			}
		}

		return 'pending';
	});

	// Helper to safely get args
	function getArg(key: string): boolean | number | string | null | undefined {
		return toolCallProp.args?.[key];
	}

	// Normalize tool name between different formats
	const toolName = $derived(() => {
		return 'name' in toolCallProp ? toolCallProp.name : toolCallProp.toolName;
	});

	function toggleExpanded() {
		expanded = !expanded;
	}

	// Get concise summary for minimal view
	const argSummary = $derived(() => {
		if (toolName() === 'addCandidate' || toolName() === 'addCandidateTool') {
			return getArg('handle') ? `${getArg('handle')}` : '';
		} else if (toolName() === 'searchInternet' || toolName() === 'searchLinkedinTool') {
			const query = getArg('query');
			if (query && typeof query === 'string') {
				return query.length > 20 ? `"${query.substring(0, 20)}..."` : `"${query}"`;
			}
			return '';
		} else if (toolName() === 'fetchLinkedinProfile') {
			return getArg('profile_url') ? 'LinkedIn' : '';
		}
		return '';
	});
</script>

<button
	class="my-1.5 flex cursor-pointer flex-col rounded-md border bg-card/60 shadow-sm transition-colors hover:bg-card"
	onclick={toggleExpanded}
	tabindex="0"
	aria-expanded={expanded}
>
	<div class="flex items-center gap-1.5 p-2">
		<ChevronRight
			class="h-3.5 w-3.5 flex-shrink-0 transition-transform {expanded ? 'rotate-90' : ''}"
		/>

		<div class="flex min-w-0 items-center gap-2">
			{#if toolName() === 'addCandidate' || toolName() === 'addCandidateTool'}
				<Badge
					variant="outline"
					class="whitespace-nowrap border-primary bg-primary/10 text-primary dark:border-primary dark:text-primary"
					>Adding Candidate</Badge
				>
			{:else if toolName() === 'searchInternet'}
				<Badge
					variant="outline"
					class="whitespace-nowrap border-primary bg-primary/10 text-primary dark:border-primary dark:text-primary"
					>Searching</Badge
				>
			{:else if toolName() === 'fetchLinkedinProfile'}
				<Badge
					variant="outline"
					class="whitespace-nowrap border-primary bg-primary/10 text-primary dark:border-primary dark:text-primary"
					>LinkedIn Profile</Badge
				>
			{:else if toolName() === 'searchLinkedinTool'}
				<Badge
					variant="outline"
					class="whitespace-nowrap border-primary bg-primary/10 text-primary dark:border-primary dark:text-primary"
					>Search</Badge
				>
			{:else}
				<Badge
					variant="outline"
					class="whitespace-nowrap border-gray-200 bg-gray-500/10 dark:border-gray-800"
					>{toolName()}</Badge
				>
			{/if}

			{#if argSummary()}
				<span class="max-w-[120px] truncate text-xs">{argSummary()}</span>
			{/if}
		</div>

		<span class="ml-auto flex-shrink-0 text-[10px] text-muted-foreground">
			{#if status() === 'success'}
				<CheckCircle class="h-4 w-4 flex-shrink-0 text-green-500" />
			{:else if status() === 'pending'}
				<LoaderCircle class="h-4 w-4 flex-shrink-0 animate-spin text-amber-500" />
			{/if}
		</span>
	</div>

	{#if expanded}
		<div class="border-t border-border/50 p-2 text-xs">
			<div class="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1.5">
				{#if toolName() === 'addCandidate' || toolName() === 'addCandidateTool'}
					{#if getArg('handle')}
						<div class="flex items-center gap-1">
							<span class="font-medium text-muted-foreground">handle:</span>
							<span class="font-mono">{getArg('handle')}</span>
						</div>
					{/if}
					{#if getArg('match_score') !== undefined || getArg('score') !== undefined}
						<div class="flex items-center gap-1">
							<span class="font-medium text-muted-foreground">score:</span>
							<span class="font-mono">{getArg('match_score') ?? getArg('score')}</span>
						</div>
					{/if}
					{#if getArg('reasoning')}
						<div class="mt-1 flex w-full items-start gap-1">
							<span class="font-medium text-muted-foreground">reason:</span>
							<span class="italic">{getArg('reasoning')}</span>
						</div>
					{/if}
				{:else if toolName() === 'searchInternet'}
					{#if getArg('query')}
						<div class="flex items-center gap-1">
							<span class="font-medium text-muted-foreground">query:</span>
							<span class="italic">"{getArg('query')}"</span>
						</div>
					{/if}
				{:else if toolName() === 'fetchLinkedinProfile'}
					{#if getArg('profile_url')}
						<div class="flex items-center gap-1">
							<span class="font-medium text-muted-foreground">url:</span>
							<span class="truncate font-mono">{getArg('profile_url')}</span>
						</div>
					{/if}
				{:else if toolName() === 'searchLinkedinTool'}
					{#if getArg('query')}
						<div class="flex items-center gap-1">
							<span class="font-medium text-muted-foreground">query:</span>
							<span class="italic">"{getArg('query')}"</span>
						</div>
					{/if}
				{:else if toolCallProp.args && Object.keys(toolCallProp.args).length > 0}
					{#each Object.entries(toolCallProp.args) as [key, value] (key)}
						<div class="flex items-center gap-1">
							<span class="font-medium text-muted-foreground">{key}:</span>
							<span class="truncate font-mono">{JSON.stringify(value)}</span>
						</div>
					{/each}
				{/if}

				{#if status() === 'success' && toolCallProp.result !== true && toolCallProp.result !== undefined}
					<div class="mt-1.5 w-full border-t border-border/50 pt-1.5">
						<span class="text-[10px] font-medium text-muted-foreground">Result:</span>
						<span class="mt-0.5 block max-w-full truncate pl-2 font-mono text-[10px]">
							{typeof toolCallProp.result === 'object'
								? JSON.stringify(toolCallProp.result)
								: String(toolCallProp.result)}
						</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</button>
