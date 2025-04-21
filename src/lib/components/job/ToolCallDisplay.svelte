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
				return query.length > 25 ? `"${query.substring(0, 25)}..."` : `"${query}"`;
			}
			return '';
		} else if (toolName() === 'fetchLinkedinProfile') {
			return getArg('profile_url') ? 'LinkedIn Profile' : '';
		}
		return '';
	});
</script>

<button
	class="my-1.5 flex w-full cursor-pointer flex-col rounded-lg border bg-card/70 shadow-sm transition-colors hover:bg-card"
	onclick={toggleExpanded}
	tabindex="0"
	aria-expanded={expanded}
	aria-label="Toggle tool call details"
>
	<div class="flex items-center gap-2 p-2.5">
		<ChevronRight
			class="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform {expanded
				? 'rotate-90'
				: ''}"
		/>

		<div class="flex min-w-0 flex-1 items-center gap-2">
			{#if toolName() === 'addCandidate' || toolName() === 'addCandidateTool'}
				<Badge
					variant="outline"
					class="whitespace-nowrap border-violet-300 bg-violet-500/10 text-violet-700 dark:border-violet-700 dark:text-violet-300"
					>Add Candidate</Badge
				>
			{:else if toolName() === 'searchInternet'}
				<Badge
					variant="outline"
					class="whitespace-nowrap border-sky-300 bg-sky-500/10 text-sky-700 dark:border-sky-700 dark:text-sky-300"
					>Search Web</Badge
				>
			{:else if toolName() === 'fetchLinkedinProfile'}
				<Badge
					variant="outline"
					class="whitespace-nowrap border-blue-300 bg-blue-500/10 text-blue-700 dark:border-blue-700 dark:text-blue-300"
					>Fetch Profile</Badge
				>
			{:else if toolName() === 'searchLinkedinTool'}
				<Badge
					variant="outline"
					class="whitespace-nowrap border-sky-300 bg-sky-500/10 text-sky-700 dark:border-sky-700 dark:text-sky-300"
					>Search LinkedIn</Badge
				>
			{:else}
				<Badge variant="secondary" class="whitespace-nowrap">{toolName()}</Badge>
			{/if}

			{#if argSummary()}
				<span class="truncate text-xs text-muted-foreground">{argSummary()}</span>
			{/if}
		</div>

		<span class="ml-auto flex-shrink-0">
			{#if status() === 'success'}
				<CheckCircle class="h-4 w-4 flex-shrink-0 text-green-500" />
			{:else if status() === 'pending'}
				<LoaderCircle class="h-4 w-4 flex-shrink-0 animate-spin text-amber-500" />
			{/if}
		</span>
	</div>

	{#if expanded}
		<div class="border-t border-border/60 px-3 py-2.5 text-xs">
			<div class="flex min-w-0 flex-col gap-y-1.5">
				{#if toolName() === 'addCandidate' || toolName() === 'addCandidateTool'}
					{#if getArg('handle')}
						<div class="flex items-center gap-1.5">
							<span class="font-medium text-muted-foreground">handle:</span>
							<span class="font-mono">{getArg('handle')}</span>
						</div>
					{/if}
					{#if getArg('match_score') !== undefined || getArg('score') !== undefined}
						<div class="flex items-center gap-1.5">
							<span class="font-medium text-muted-foreground">score:</span>
							<span class="font-mono">{getArg('match_score') ?? getArg('score')}</span>
						</div>
					{/if}
					{#if getArg('reasoning')}
						<div class="mt-1 flex w-full items-start gap-1.5">
							<span class="flex-shrink-0 font-medium text-muted-foreground">reason:</span>
							<span class="italic">{getArg('reasoning')}</span>
						</div>
					{/if}
				{:else if toolName() === 'searchInternet'}
					{#if getArg('query')}
						<div class="flex items-center gap-1.5">
							<span class="font-medium text-muted-foreground">query:</span>
							<span class="italic">"{getArg('query')}"</span>
						</div>
					{/if}
				{:else if toolName() === 'fetchLinkedinProfile'}
					{#if getArg('profile_url')}
						<div class="flex items-center gap-1.5">
							<span class="font-medium text-muted-foreground">url:</span>
							<span class="truncate font-mono">{getArg('profile_url')}</span>
						</div>
					{/if}
				{:else if toolName() === 'searchLinkedinTool'}
					{#if getArg('query')}
						<div class="flex items-center gap-1.5">
							<span class="font-medium text-muted-foreground">query:</span>
							<span class="italic">"{getArg('query')}"</span>
						</div>
					{/if}
				{:else if toolCallProp.args && Object.keys(toolCallProp.args).length > 0}
					{#each Object.entries(toolCallProp.args) as [key, value] (key)}
						<div class="flex items-center gap-1.5">
							<span class="font-medium text-muted-foreground">{key}:</span>
							<span class="truncate font-mono">{JSON.stringify(value)}</span>
						</div>
					{/each}
				{/if}

				{#if status() === 'success' && toolCallProp.result !== true && toolCallProp.result !== undefined && toolCallProp.result !== null}
					<div class="mt-2 w-full border-t border-border/60 pt-2">
						<div class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
							Result
						</div>
						<pre
							class="mt-1 block max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-muted/50 p-1.5 font-mono text-[11px]">{typeof toolCallProp.result ===
							'object'
								? JSON.stringify(toolCallProp.result, null, 2)
								: String(toolCallProp.result)}</pre>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</button>
