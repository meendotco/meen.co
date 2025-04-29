import type { RequestEvent } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

import { db } from '@/server/db';
import { jobPost } from '@/server/db/schema';
import { insertJob } from '@/server/job';
import type { Job } from '@/types/job';
import { getGoogleAuthClient, readGoogleCalendar } from '@/server/google';
import { google } from 'googleapis';
import { json } from '@sveltejs/kit';
export const GET = async ({ request, locals }: RequestEvent) => {
	try {
		const user = locals.user;
		const googleAuthClient = await getGoogleAuthClient(user.id);
		const calendar = google.calendar({ version: 'v3', auth: googleAuthClient });
		const events = await calendar.events.list({
			calendarId: 'primary',
			timeMin: new Date().toISOString(),
			timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
		});
		return json(events);
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ error: 'Failed to create job' }), {
			status: 500
		});
	}
};
