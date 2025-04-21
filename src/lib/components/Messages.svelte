<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';
	import { onMount } from 'svelte';

	import ToolCallDisplay from '$lib/components/job/ToolCallDisplay.svelte';
	import Markdown from '$lib/markdown/Markdown.svelte';
	import type { chatMessage, toolcall } from '$lib/server/db/schema';

	type ToolcallSelect = InferSelectModel<typeof toolcall>;
	type MessageSelect = InferSelectModel<typeof chatMessage> & {
		toolcalls: ToolcallSelect[];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		messageChunks: Array<{ id: string; chunk: any }>;
	};

	let { messages, errorMessage } = $props<{
		messages: MessageSelect[];
		errorMessage: string | null;
	}>();

	function formatDate(date: Date | string | null) {
		if (!date) return '';
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function scrollToMessage(id: string) {
		const messageElement = document.getElementById(`message-${id}`);
		if (messageElement) {
			messageElement.scrollIntoView({ behavior: 'smooth' });
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function groupMessageChunks(chunks: Array<{ id: string; chunk: any }>) {
		if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
			return chunks;
		}

		const result = [];
		let currentTextContent = '';
		let currentTextId = '';

		for (let i = 0; i < chunks.length; i++) {
			const chunk = chunks[i];

			if (chunk.chunk.type === 'text-delta' && typeof chunk.chunk.textDelta === 'string') {
				// Accumulate text content
				if (currentTextId === '') {
					currentTextId = chunk.id;
				}
				currentTextContent += chunk.chunk.textDelta;
			} else {
				// If we have accumulated text, push it as a text chunk
				if (currentTextContent) {
					result.push({
						id: currentTextId,
						chunk: { type: 'text-delta', textDelta: currentTextContent }
					});
					currentTextContent = '';
					currentTextId = '';
				}

				// Push the non-text chunk
				result.push(chunk);
			}
		}

		// Don't forget any remaining text content
		if (currentTextContent) {
			result.push({
				id: currentTextId,
				chunk: { type: 'text-delta', textDelta: currentTextContent }
			});
		}

		return result;
	}

	$effect(() => {
		if (messages.length) {
			scrollToMessage(messages[messages.length - 1].id);
		}
	});

	onMount(() => {
		if (messages.length) {
			scrollToMessage(messages[messages.length - 1].id);
		}
	});
</script>

<div class="flex h-full flex-col space-y-4 overflow-y-auto px-0.5">
	{#if messages.length !== 0}
		{#each messages as msg (msg.id)}
			<div class:flex-row-reverse={msg.role === 'user'} class="flex items-end gap-2">
				{#if msg.role === 'user'}
					<div
						class="relative max-w-[85%] rounded-2xl rounded-br-none bg-primary p-3 text-primary-foreground shadow-sm"
					>
						<div class="prose prose-sm dark:prose-invert max-w-none">
							<Markdown md={msg.content ?? '​'} />
						</div>
						<p class="mt-1 text-right text-xs opacity-60">
							{formatDate(msg.createdAt)}
						</p>
						<div id={`message-${msg.id}`}></div>
					</div>
				{:else}
					<div
						class="relative max-w-[85%] rounded-2xl rounded-bl-none border border-border/50 bg-card p-3 text-card-foreground shadow-sm"
					>
						{#if msg.messageChunks?.length}
							{@const groupedChunks = groupMessageChunks(msg.messageChunks)}
							{#each groupedChunks as chunk (chunk.id)}
								<div class="prose prose-sm dark:prose-invert max-w-none">
									{#if chunk.chunk.type === 'text-delta'}
										<Markdown md={chunk.chunk.textDelta} />
									{/if}
									{#if chunk.chunk.type === 'tool-call'}
										<div class="mt-2 space-y-1 pt-2">
											<ToolCallDisplay toolcall={chunk.chunk} chunks={msg.messageChunks} />
										</div>
									{/if}
								</div>
							{/each}
						{:else}
							<div class="prose prose-sm dark:prose-invert max-w-none">
								<Markdown md={msg.content ?? '​'} />
							</div>
						{/if}
						<p class="mt-1 text-right text-xs opacity-60">
							{formatDate(msg.createdAt)}
						</p>
						<div id={`message-${msg.id}`}></div>
					</div>
				{/if}
			</div>
		{/each}
	{:else}
		<div class="flex h-full flex-col items-center justify-center p-4 text-center">
			<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-6 w-6 text-primary"
					><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg
				>
			</div>
			<p class="text-sm text-muted-foreground">
				Start chatting with the recruiter agent to find the best candidates for your job.
			</p>
		</div>
	{/if}

	{#if errorMessage}
		<div
			class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
		>
			{errorMessage}
		</div>
	{/if}
</div>
