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
	import AddCandidateDialog from '$lib/components/job/AddCandidateDialog.svelte';
	import { Download } from 'lucide-svelte';
	import type {
		candidates as candidatesTable,
		chat as chatTable,
		chatMessage as chatMessageTable,
		jobPost as jobPostTable,
		linkedInProfile as linkedInProfileTable,
		toolcall as toolcallTable,
		customField as customFieldTable,
		customFieldValue as customFieldValueTable
	} from '$lib/server/db/schema';
	import { socket } from '$lib/websocket/client.svelte';
	import { onMount } from 'svelte';
	type JobPostSelect = InferSelectModel<typeof jobPostTable>;
	type LinkedInProfileSelect = InferSelectModel<typeof linkedInProfileTable>;
	type CustomFieldSelect = InferSelectModel<typeof customFieldTable>;
	type CustomFieldValueSelect = InferSelectModel<typeof customFieldValueTable> & {
		customField: CustomFieldSelect;
	};
	type CandidateSelect = InferSelectModel<typeof candidatesTable> & {
		linkedInProfile: LinkedInProfileSelect | null;
		matchScore?: number | null;
		reasoning?: string | null;
		customFieldValues?: CustomFieldValueSelect[];
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
	let view = $state<'list' | 'table'>(data.job.view);

	function exportToCsv() {
		const headers = [
			'Name',
			'Title',
			'Assessment',
			'Reasoning',
			...job.customFields.map((f: CustomFieldSelect) => f.name)
		];
		const rows = candidates.map((candidate) => {
			const profileData = candidate.linkedInProfile?.data;
			const name =
				`${profileData?.first_name ?? ''} ${profileData?.last_name ?? ''}`.trim() || 'N/A';
			const title = profileData?.headline ?? 'N/A';
			const assessment = candidate.matchScore != null ? `${candidate.matchScore}/100` : 'N/A';
			const reasoning = candidate.reasoning ?? 'N/A';
			const customValues = job.customFields.map((field: CustomFieldSelect) => {
				const value = candidate.customFieldValues?.find(
					(cfv: CustomFieldValueSelect) => cfv.customFieldId === field.id
				)?.value;
				return value != null ? String(value) : 'N/A';
			});
			return [name, title, assessment, reasoning, ...customValues];
		});

		const csvContent = [
			headers.join(','),
			...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute(
			'download',
			`candidates-${job.title}-${new Date().toISOString().split('T')[0]}.csv`
		);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	onMount(() => {
		socket.on(`${job.id}:candidate-added`, (candidate: CandidateSelect) => {
			if (!candidates.some((c) => c.id === candidate.id)) {
				candidates.unshift({ ...candidate, isNew: true });
			}
		});
	});

	async function changeView(setView: 'list' | 'table') {
		view = setView;
		await fetch(`/api/job/${job.id}/view`, {
			method: 'POST',
			body: JSON.stringify({ view: setView })
		});
	}
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

						<div class="flex gap-2">
							<Button variant="outline" onclick={() => changeView('list')}>List View</Button>
							<Button variant="outline" onclick={() => changeView('table')}>Table View</Button>
							<Button variant="outline" onclick={exportToCsv} class="flex items-center gap-2">
								<Download class="h-4 w-4" />
								Export CSV
							</Button>
							<AddCandidateDialog jobId={job.id} />
						</div>

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
