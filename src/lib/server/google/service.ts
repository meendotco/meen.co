import { google, type calendar_v3, type gmail_v1 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { getGoogleAuthClient } from './index'; // Assuming getGoogleAuthClient is exported from index.ts

type CalendarEvent = calendar_v3.Schema$Event;

export class GoogleService {
	private auth: OAuth2Client;
	private calendar: calendar_v3.Calendar | undefined;
	private gmail: gmail_v1.Gmail | undefined;

	private constructor(auth: OAuth2Client) {
		this.auth = auth;
	}

	public static async create(userId: string): Promise<GoogleService> {
		const auth = await getGoogleAuthClient(userId);
		return new GoogleService(auth);
	}

	private getCalendarClient(): calendar_v3.Calendar {
		if (!this.calendar) {
			this.calendar = google.calendar({ version: 'v3', auth: this.auth });
		}
		return this.calendar;
	}

	private getGmailClient(): gmail_v1.Gmail {
		if (!this.gmail) {
			this.gmail = google.gmail({ version: 'v1', auth: this.auth });
		}
		return this.gmail;
	}

	// --- Calendar Methods ---

	async getCalendarEvents(
		timeMin?: string,
		timeMax?: string
	): Promise<CalendarEvent[] | undefined> {
		const calendar = this.getCalendarClient();
		try {
			const response = await calendar.events.list({
				calendarId: 'primary',
				timeMin: timeMin || new Date().toISOString(),
				timeMax,
				singleEvents: true,
				orderBy: 'startTime'
			});
			return response.data.items || [];
		} catch (error) {
			console.error('Error reading Google Calendar:', error);
			// Decide how to handle errors, e.g., return undefined, empty array, or throw
			return undefined;
		}
	}

	// Add createCalendarEvent, updateCalendarEvent, deleteCalendarEvent methods here, adapting from index.ts

	// --- Gmail Methods ---

	async getGmailMessageIds(
		query?: string,
		maxResults?: number
	): Promise<gmail_v1.Schema$Message[]> {
		const gmail = this.getGmailClient();
		try {
			const response = await gmail.users.messages.list({
				userId: 'me',
				q: query,
				maxResults: maxResults || 10
			});
			return response.data.messages || [];
		} catch (error) {
			console.error('Error listing Gmail messages:', error);
			return [];
		}
	}

	async getGmailMessageDetails(messageId: string): Promise<gmail_v1.Schema$Message | undefined> {
		const gmail = this.getGmailClient();
		if (!messageId) {
			console.warn('getGmailMessageDetails called without messageId');
			return undefined;
		}
		try {
			const response = await gmail.users.messages.get({
				userId: 'me',
				id: messageId,
				format: 'full' // or 'metadata' or 'raw'
			});
			return response.data;
		} catch (error) {
			console.error(`Error getting details for Gmail message ${messageId}:`, error);
			return undefined;
		}
	}

	// Add sendGmailMessage method here if needed
}
