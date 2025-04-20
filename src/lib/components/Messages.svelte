<script lang="ts">
	import type { InferSelectModel } from 'drizzle-orm';
	import { onMount } from 'svelte';

	import Markdown from '$lib/markdown/Markdown.svelte';
	import type { chatMessage, toolcall } from '$lib/server/db/schema';

	type ToolcallSelect = InferSelectModel<typeof toolcall>;
	type MessageSelect = InferSelectModel<typeof chatMessage> & {
		toolcalls: ToolcallSelect[];
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

<div class=" h-screen space-y-4 overflow-y-auto">
	{#if messages.length !== 0}
		{#each messages as msg (msg.id)}
			<div class:flex-row-reverse={msg.role === 'user'} class="flex items-end gap-2">
				<div
					class:bg-primary={msg.role === 'user'}
					class:text-primary-foreground={msg.role === 'user'}
					class:bg-card={msg.role === 'assistant'}
					class:text-card-foreground={msg.role === 'assistant'}
					class="max-w-[75%] rounded-lg p-3 shadow-sm"
				>
					<div class="prose prose-sm dark:prose-invert max-w-none">
						<Markdown md={msg.content ?? '​'} />
					</div>
					<p class="mt-1 text-right text-xs text-muted-foreground/80">
						{formatDate(msg.createdAt)}
					</p>

					<div id={`message-${msg.id}`}></div>
				</div>
			</div>
		{/each}
	{:else}
		<p class="text-muted-foreground">
			Start chatting with the recruiter agent to find the best candidates for your job.
		</p>
	{/if}
	{#if errorMessage}
		<div
			class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
		>
			{errorMessage}
		</div>
	{/if}
</div>
