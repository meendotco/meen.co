<script lang="ts">
	import type { TextStreamPart } from 'ai';
	import type { InferSelectModel } from 'drizzle-orm';

	import CandidateList from '$lib/components/job/CandidateList.svelte';
	import AIChat from '$lib/components/job/AIChat.svelte'; // Added import
	import CandidateTable from '$lib/components/job/CandidateTable.svelte'; // Changed import
	import JobDescriptionCard from '$lib/components/job/JobDescriptionCard.svelte';
	import JobDetailsCard from '$lib/components/job/JobDetailsCard.svelte';
	import JobHeader from '$lib/components/job/JobHeader.svelte';
	import JobOverviewCard from '$lib/components/job/JobOverviewCard.svelte';
	import JobRequirementsBenefitsCard from '$lib/components/job/JobRequirementsBenefitsCard.svelte';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Resizable from '$lib/components/ui/resizable';
	import type {
		candidates as candidatesTable,
		chat as chatTable,
		chatMessage as chatMessageTable,
		jobPost as jobPostTable,
		linkedInProfile as linkedInProfileTable,
		toolcall as toolcallTable
	} from '$lib/server/db/schema';
	type JobPostSelect = InferSelectModel<typeof jobPostTable>;
	type LinkedInProfileSelect = InferSelectModel<typeof linkedInProfileTable>;
	type CandidateSelect = InferSelectModel<typeof candidatesTable> & {
		linkedInProfile: LinkedInProfileSelect | null;
	};
	type MessageChunk = {
		id: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		chunk: TextStreamPart<any>;
	};
	type ToolcallSelect = InferSelectModel<typeof toolcallTable>;
	type MessageSelect = InferSelectModel<typeof chatMessageTable> & {
		toolcalls: ToolcallSelect[];
		messageChunks: MessageChunk[];
	};
	type ChatSelect = InferSelectModel<typeof chatTable> & {
		messages: MessageSelect[];
	};
	type FullJobData = JobPostSelect & {
		candidates: CandidateSelect[];
		chat: ChatSelect | null;
	};

	let { data } = $props<{ data: { job: FullJobData } }>();
	let job = $state(data.job);
	let candidates = $derived<CandidateSelect[]>(job?.candidates ?? []);
	let initialMessages = $derived<MessageSelect[]>(data.job?.chat?.messages ?? []);
	let chatId = $state(data.job?.chat?.id);
	let view = $state<'list' | 'table'>('list');
</script>

<div class="flex h-screen flex-col overflow-hidden bg-background">
	<JobHeader {job} />

	{#if job}
		<Resizable.PaneGroup direction="horizontal" class="h-full">
			<Resizable.Pane defaultSize={70} class="flex h-full flex-col">
				<div class="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4">
					<div class="space-y-4 sm:space-y-6">
						<div class="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
							<JobOverviewCard {job} />
							<JobRequirementsBenefitsCard {job} />
						</div>
						<JobDescriptionCard {job} />
						<JobDetailsCard {job} />

						<Button variant="outline" onclick={() => (view = 'list')}>List View</Button>
						<Button variant="outline" onclick={() => (view = 'table')}>Table View</Button>

						{#if view === 'list'}
							<CandidateList {candidates} jobId={job.id} />
						{:else}
							<CandidateTable {candidates} jobId={job.id} customFields={job.customFields} />
						{/if}
					</div>
				</div>
			</Resizable.Pane>

			<Resizable.Handle withHandle />

			<Resizable.Pane defaultSize={30} minSize={20} maxSize={35} class="flex h-full flex-col">
				<AIChat jobId={job.id} {chatId} {initialMessages} />
			</Resizable.Pane>
		</Resizable.PaneGroup>
	{:else}
		<div class="flex h-screen items-center justify-center bg-background">
			<Card class="w-full max-w-md shadow-lg">
				<CardContent class="flex items-center justify-center p-6 sm:p-8">
					<p class="text-muted-foreground">
						Job not found or you do not have permission to view it.
					</p>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
