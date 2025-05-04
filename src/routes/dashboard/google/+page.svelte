<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Plus, Calendar, Video, Clock, Users, Mail } from 'lucide-svelte';
	import { formatDate } from '$lib/utils';

	let { data } = $props<{
		meetings: App.GoogleMeeting[];
		emails: App.GoogleEmail[];
		error?: string | null;
	}>();

	let meetings = $state(data.meetings || []);
	let emails = $state(data.emails || []);
	let error = $state(data.error || null);
	let isLoading = $state(false);

	// Format the date and time nicely
	function formatMeetingTime(date: Date | string | null): string {
		if (!date) return 'N/A';
		// Ensure we have a Date object
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatMeetingDuration(
		start: Date | string | null,
		end: Date | string | null
	): string | null {
		if (!start || !end) return null;
		const startDate = typeof start === 'string' ? new Date(start) : start;
		const endDate = typeof end === 'string' ? new Date(end) : end;
		const durationMs = endDate.getTime() - startDate.getTime();
		const hours = Math.floor(durationMs / (1000 * 60 * 60));
		const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

		let durationString = '';
		if (hours > 0) durationString += `${hours}h `;
		if (minutes > 0) durationString += `${minutes}m`;

		return durationString.trim() || null;
	}

	async function refreshMeetings() {
		isLoading = true;
		error = null;
		try {
			// Use page refresh to reload data
			window.location.reload();
		} catch (err: any) {
			error = err.message || 'An error occurred while refreshing meetings';
			console.error('Error refreshing meetings:', err);
			isLoading = false;
		}
	}
</script>

<div class="container mx-auto py-6">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Google Data</h1>
		<Button onclick={refreshMeetings} variant="outline" disabled={isLoading}>
			{#if isLoading}
				<span class="mr-2">Loading...</span>
			{:else}
				<Plus class="mr-2 h-4 w-4" />
				<span>Refresh Data</span>
			{/if}
		</Button>
	</div>

	{#if error}
		<div class="mb-6 rounded-md bg-destructive/20 p-4 text-destructive">
			{error}
		</div>
	{/if}

	{#if meetings.length === 0 && emails.length === 0 && !isLoading && !error}
		<Card>
			<CardContent class="flex flex-col items-center justify-center p-10">
				<Calendar class="mb-4 h-16 w-16 text-muted-foreground" />
				<p class="text-center text-xl font-medium">No Google data found</p>
				<p class="mt-2 text-center text-muted-foreground">
					Data from your connected Google account will appear here.
				</p>
			</CardContent>
		</Card>
	{:else}
		<div class="space-y-8">
			<!-- Meetings Section -->
			<div>
				<h2 class="mb-4 text-2xl font-semibold">Meetings</h2>
				{#if meetings.length > 0}
					<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{#each meetings as meeting (meeting.id)}
							{@const duration = formatMeetingDuration(meeting.startTime, meeting.endTime)}
							<Card>
								<CardHeader class="pb-2">
									<CardTitle class="truncate text-lg font-medium">
										{meeting.summary || 'Untitled Meeting'}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div class="space-y-3">
										<div class="flex items-start">
											<Clock class="mr-2 mt-1 h-4 w-4 text-muted-foreground" />
											<div>
												<div class="font-medium">
													{meeting.startTime
														? formatDate(meeting.startTime, {
																weekday: 'short',
																day: 'numeric',
																month: 'short'
															})
														: 'No date'}
												</div>
												<div class="text-sm text-muted-foreground">
													{meeting.startTime ? formatMeetingTime(meeting.startTime) : 'No time'}
													{#if duration}({duration}){/if}
												</div>
											</div>
										</div>

										{#if Array.isArray(meeting.attendees) && meeting.attendees.length > 0}
											<div class="flex items-start">
												<Users class="mr-2 mt-1 h-4 w-4 text-muted-foreground" />
												<div>
													<div class="font-medium">Attendees</div>
													<div class="text-sm text-muted-foreground">
														{meeting.attendees.length} participant{meeting.attendees.length > 1
															? 's'
															: ''}
													</div>
												</div>
											</div>
										{/if}

										{#if meeting.hangoutLink}
											<div class="flex items-start">
												<Video class="mr-2 mt-1 h-4 w-4 text-muted-foreground" />
												<div>
													<a
														href={meeting.hangoutLink}
														target="_blank"
														rel="noopener noreferrer"
														class="font-medium text-primary hover:underline"
													>
														Join Google Meet
													</a>
												</div>
											</div>
										{/if}

										{#if meeting.description}
											<Separator />
											<div>
												<div class="mb-1 font-medium">Description</div>
												<div class="line-clamp-3 text-sm text-muted-foreground">
													{@html meeting.description}
												</div>
											</div>
										{/if}

										<div class="mt-4">
											<a
												href={meeting.htmlLink}
												target="_blank"
												rel="noopener noreferrer"
												class="text-sm text-muted-foreground hover:text-primary"
											>
												View in Google Calendar
											</a>
										</div>
									</div>
								</CardContent>
							</Card>
						{/each}
					</div>
				{:else if !isLoading}
					<Card>
						<CardContent class="flex flex-col items-center justify-center p-10">
							<Calendar class="mb-4 h-16 w-16 text-muted-foreground" />
							<p class="text-center text-xl font-medium">No upcoming meetings found</p>
						</CardContent>
					</Card>
				{/if}
			</div>
		</div>
	{/if}

	{#if isLoading}
		<div class="mt-8 flex items-center justify-center p-10">
			<div class="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
		</div>
	{/if}
</div>
