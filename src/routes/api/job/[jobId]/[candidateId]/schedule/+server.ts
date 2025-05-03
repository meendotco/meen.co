import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { dev } from '$app/environment';

import { db } from '@/server/db';
import { candidates, chat, jobPost } from '@/server/db/schema';

export const POST = async ({ locals, params }) => {
	const jobId = params.jobId;
	const user = locals.user;
	const candidateId = params.candidateId;

	const userHasAccess = await db.query.jobPost.findFirst({
		where: and(eq(jobPost.id, jobId), eq(jobPost.ownerOrganizationHandle, user.organizationHandle))
	});
	if (!userHasAccess) {
		return json({ error: 'You do not have access to this job' }, { status: 403 });
	}

	const job = await db.query.jobPost.findFirst({
		where: eq(jobPost.id, jobId),
		with: {
			chat: true,
			candidates: {
				where: eq(candidates.id, candidateId),
				with: {
					linkedInProfile: true
				}
			}
		}
	});

	if (!job) {
		return json({ error: 'Job not found' }, { status: 404 });
	}

	if (job.candidates.length === 0) {
		return json({ error: 'Candidate not found' }, { status: 404 });
	}

	const candidate = job.candidates[0];
	const profileData = candidate.linkedInProfile?.data;

	if (!profileData) {
		return json({ error: 'Candidate profile data not found' }, { status: 404 });
	}

	// Extract candidate details
	const fullName =
		`${profileData.first_name ?? ''} ${profileData.last_name ?? ''}`.trim() || 'Candidate';
	let email = profileData.personal_emails?.[0] ?? '';

	// Override email in development
	if (dev) {
		email = 'markus.andersson@ai.se';
		console.log(`[Dev Mode] Overriding schedule email to: ${email}`);
	}

	if (!email) {
		return json({ error: 'Candidate email not found' }, { status: 404 });
	}

	// Create a date object for tomorrow at the current time
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);

	// Format the date for Google Calendar
	const startDate = tomorrow.toISOString().replace(/-|:|\.\d+/g, '');
	const endDate = new Date(tomorrow.getTime() + 60 * 60 * 1000)
		.toISOString()
		.replace(/-|:|\.\d+/g, '');

	// Build Google Calendar URL with pre-filled information
	const url = new URL('https://calendar.google.com/calendar/render');
	url.searchParams.append('action', 'TEMPLATE');
	url.searchParams.append('text', `Interview with ${fullName}`);
	url.searchParams.append(
		'details',
		`Job interview with ${fullName} for position: ${job.title ?? 'Open Position'}`
	);
	url.searchParams.append('dates', `${startDate}/${endDate}`);
	if (email) {
		url.searchParams.append('add', email);
	}
	url.searchParams.append('ctz', 'UTC'); // Use UTC as server-side doesn't have browser timezone

	// Save the scheduling event to the database if needed
	// This could include logging the scheduled meeting or updating candidate status

	return json(
		{
			message: 'Meeting scheduled successfully',
			calendarUrl: url.toString()
		},
		{ status: 200 }
	);
};
