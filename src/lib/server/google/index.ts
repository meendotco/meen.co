import { google } from 'googleapis';

import { accounts } from '@/server/db/schema';
import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import type { gmail_v1 } from 'googleapis';
import { AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET } from '$env/static/private';

interface CalendarEvent {
	summary: string;
	description?: string;
	start: {
		dateTime: string;
		timeZone: string;
	};
	end: {
		dateTime: string;
		timeZone: string;
	};
	attendees?: Array<{ email: string }>;
}

export async function getGoogleAuthClient(userId: string) {
	const account = await db.query.accounts.findFirst({
		where: and(eq(accounts.userId, userId), eq(accounts.provider, 'google')),
		columns: {
			access_token: true,
			refresh_token: true,
			expires_at: true,
			provider: true
		}
	});

	if (!account) {
		throw new Error('No Google account found for user');
	}

	if (account.provider !== 'google') {
		throw new Error('Account is not a Google account');
	}

	if (!account.access_token) {
		throw new Error('No access token found for Google account');
	}

	const oauth2Client = new google.auth.OAuth2();
	oauth2Client.setCredentials({ access_token: account.access_token });

	// If the token is expired and we have a refresh token, try to refresh it
	if (account.expires_at && account.expires_at * 1000 < Date.now() && account?.refresh_token) {
		try {
			const { credentials } = await oauth2Client.refreshAccessToken();
			oauth2Client.setCredentials(credentials);
		} catch (error) {
			console.error('Error refreshing Google access token:', error);
			throw new Error('Failed to refresh Google access token');
		}
	}

	return oauth2Client;
}

export async function readGoogleCalendar(userId: string, timeMin?: string, timeMax?: string) {
	const auth = await getGoogleAuthClient(userId);
	const calendar = google.calendar({ version: 'v3', auth });

	try {
		const response = await calendar.events.list({
			calendarId: 'primary',
			timeMin: timeMin || new Date().toISOString(),
			timeMax,
			singleEvents: true,
			orderBy: 'startTime'
		});

		return response.data.items;
	} catch (error) {
		console.error('Error reading Google Calendar:', error);
		throw error;
	}
}

export async function createCalendarEvent(userId: string, event: CalendarEvent) {
	const auth = await getGoogleAuthClient(userId);
	const calendar = google.calendar({ version: 'v3', auth });

	try {
		const response = await calendar.events.insert({
			calendarId: 'primary',
			requestBody: event
		});

		return response.data;
	} catch (error) {
		console.error('Error creating Google Calendar event:', error);
		throw error;
	}
}

export async function updateCalendarEvent(
	userId: string,
	eventId: string,
	event: Partial<CalendarEvent>
) {
	const auth = await getGoogleAuthClient(userId);
	const calendar = google.calendar({ version: 'v3', auth });

	try {
		const response = await calendar.events.update({
			calendarId: 'primary',
			eventId,
			requestBody: event
		});

		return response.data;
	} catch (error) {
		console.error('Error updating Google Calendar event:', error);
		throw error;
	}
}

export async function deleteCalendarEvent(userId: string, eventId: string) {
	const auth = await getGoogleAuthClient(userId);
	const calendar = google.calendar({ version: 'v3', auth });

	try {
		await calendar.events.delete({
			calendarId: 'primary',
			eventId
		});

		return true;
	} catch (error) {
		console.error('Error deleting Google Calendar event:', error);
		throw error;
	}
}
