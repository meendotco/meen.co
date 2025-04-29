import { google } from 'googleapis';
import { db, googleMeeting, users, accounts, googleEmail } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

const ONE_HOUR_MS = 60 * 60 * 1000;

export const load = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		throw error(401, 'Not authenticated');
	}

	const userId = user.id;

	try {
		// Get user data
		const [userData] = await db
			.select()
			.from(users)
			.where(sql`${users.id} = ${userId}`);

		const now = new Date();
		let storedMeetings: App.GoogleMeeting[] = [];
		let storedEmails: App.GoogleEmail[] = [];

		// Initialize Google Calendar API
		// Otherwise, fetch fresh meeting data
		// Get Google token from account
		const [account] = await db
			.select()
			.from(accounts)
			.where(sql`${accounts.userId} = ${userId} AND ${accounts.provider} = 'google'`);

		const auth = new google.auth.OAuth2();
		auth.setCredentials({ access_token: account.access_token });
		const calendar = google.calendar({ version: 'v3', auth });

		const emails = await google.gmail({ version: 'v1', auth });
		const emailResponse = await emails.users.messages.list({
			userId: 'me',
			q: 'from:me'
		});

		console.log(emailResponse.data.messages);
		// If we already fetched meetings within the last hour, return the stored meetings
		const lastMeetingUpdate = userData?.lastUpdatedMeetings
			? new Date(userData.lastUpdatedMeetings)
			: null;

		if (lastMeetingUpdate && now.getTime() - lastMeetingUpdate.getTime() < ONE_HOUR_MS) {
			storedMeetings = await db
				.select()
				.from(googleMeeting)
				.where(sql`${googleMeeting.userId} = ${userId}`);
		} else {
			// Fetch fresh meeting data
			console.log(emailResponse);

			// Fetch upcoming meetings for the next 30 days
			const timeMin = now.toISOString();
			const thirtyDaysLater = new Date(now);
			thirtyDaysLater.setDate(now.getDate() + 30);
			const timeMax = thirtyDaysLater.toISOString();

			const response = await calendar.events.list({
				calendarId: 'primary',
				timeMin,
				timeMax,
				singleEvents: true,
				orderBy: 'startTime'
			});

			const events = response.data.items || [];

			// Store events in the database
			// First delete old events for this user
			await db.delete(googleMeeting).where(sql`${googleMeeting.userId} = ${userId}`);

			// Then insert new events with individual inserts to avoid type issues
			if (events.length > 0) {
				for (const event of events) {
					if (event.id) {
						// Process event data to match our schema
						const startTimeObj = event.start?.dateTime
							? new Date(event.start.dateTime)
							: event.start?.date
								? new Date(event.start.date)
								: null;

						const endTimeObj = event.end?.dateTime
							? new Date(event.end.dateTime)
							: event.end?.date
								? new Date(event.end.date)
								: null;

						await db.execute(sql`
							INSERT INTO "googleMeeting" (
								"id", "userId", "googleMeetingId", "summary", "description", 
								"htmlLink", "hangoutLink", "startTime", "endTime", 
								"attendees", "organizerEmail", "status", "conferenceData", "rawData", 
								"createdAt", "updatedAt"
							) VALUES (
								${crypto.randomUUID()}, ${userId}, ${event.id}, ${event.summary || null}, ${event.description || null},
								${event.htmlLink || null}, ${event.hangoutLink || null}, 
								${startTimeObj?.toISOString() || null}, ${endTimeObj?.toISOString() || null},
								${event.attendees ? JSON.stringify(event.attendees) : null}, 
								${event.organizer?.email || null}, ${event.status || null}, 
								${event.conferenceData ? JSON.stringify(event.conferenceData) : null}, 
								${JSON.stringify(event)},
								${new Date().toISOString()}, ${new Date().toISOString()}
							)
						`);
					}
				}
				storedMeetings = await db
					.select()
					.from(googleMeeting)
					.where(sql`${googleMeeting.userId} = ${userId}`);
			}

			// Update last updated timestamp
			await db
				.update(users)
				.set({ lastUpdatedMeetings: now })
				.where(sql`${users.id} = ${userId}`);
		}

		// --- Email Fetching Logic ---
		const lastEmailUpdate = userData?.lastUpdatedEmails
			? new Date(userData.lastUpdatedEmails)
			: null;
		if (lastEmailUpdate && now.getTime() - lastEmailUpdate.getTime() < ONE_HOUR_MS) {
			storedEmails = await db
				.select()
				.from(googleEmail)
				.where(sql`${googleEmail.userId} = ${userId}`);
		} else {
			// Fetch fresh email list (IDs only for now)
			const gmail = google.gmail({ version: 'v1', auth });
			const emailResponse = await gmail.users.messages.list({
				userId: 'me',
				maxResults: 50 // Limit results for performance
			});

			const emails = emailResponse.data.messages || [];

			// Store email IDs
			await db.delete(googleEmail).where(sql`${googleEmail.userId} = ${userId}`);
			if (emails.length > 0) {
				const emailsToInsert = emails
					.filter((email) => email.id && email.threadId)
					.map((email) => ({
						id: crypto.randomUUID(),
						userId: userId,
						googleEmailId: email.id!,
						googleThreadId: email.threadId!,
						createdAt: now,
						updatedAt: now
					}));
				await db.insert(googleEmail).values(emailsToInsert);
				storedEmails = await db
					.select()
					.from(googleEmail)
					.where(sql`${googleEmail.userId} = ${userId}`);
			}
			// Update last updated timestamp for emails
			await db
				.update(users)
				.set({ lastUpdatedEmails: now })
				.where(sql`${users.id} = ${userId}`);
		}

		return {
			meetings: storedMeetings,
			emails: storedEmails
		};
	} catch (err) {
		console.error('Error fetching Google data:', err);
		// Attempt to return any cached data even if fetching fails
		try {
			const cachedMeetings = await db
				.select()
				.from(googleMeeting)
				.where(sql`${googleMeeting.userId} = ${userId}`);
			const cachedEmails = await db
				.select()
				.from(googleEmail)
				.where(sql`${googleEmail.userId} = ${userId}`);
			return {
				meetings: cachedMeetings,
				emails: cachedEmails,
				error: 'Failed to fetch fresh Google data'
			};
		} catch (dbError) {
			console.error('Error fetching cached Google data:', dbError);
			return {
				meetings: [],
				emails: [],
				error: 'Failed to fetch Google data'
			};
		}
	}
};
