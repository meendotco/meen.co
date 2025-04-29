import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { SvelteKitAuth } from '@auth/sveltekit';
import LinkedIn from '@auth/sveltekit/providers/linkedin';
import Google from '@auth/sveltekit/providers/google';
import { AUTH_TRUST_HOST } from '$env/static/private';
import {
	accounts,
	db,
	sessions,
	users,
	verificationTokens,
	googleMeeting
} from '$lib/server/db/schema';
import { google } from 'googleapis';
import { eq, sql } from 'drizzle-orm';

export const { handle, signIn, signOut } = SvelteKitAuth({
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens
	}),
	providers: [
		LinkedIn,
		Google({
			authorization: {
				params: {
					scope: [
						'openid',
						'https://www.googleapis.com/auth/userinfo.email',
						'https://www.googleapis.com/auth/userinfo.profile',
						'https://www.googleapis.com/auth/calendar.events',
						'https://www.googleapis.com/auth/calendar.readonly',
						'https://www.googleapis.com/auth/gmail.readonly'
					].join(' '),
					access_type: 'offline',
					prompt: 'consent'
				}
			}
		})
	],

	callbacks: {
		async signIn({ account }) {
			// quick live test of the brand-new token
			if (!account) {
				return false;
			}
			console.log('account', account);

			// Only attempt Gmail and Calendar validation if we have a Google account with access token
			if (account.provider === 'google' && account.access_token) {
				try {
					const auth = new google.auth.OAuth2();
					auth.setCredentials({ access_token: account.access_token });

					await db
						.update(accounts)
						.set({
							access_token: account.access_token,
							refresh_token: account.refresh_token,
							expires_at: account.expires_at
						})
						.where(eq(accounts.providerAccountId, account.providerAccountId));

					// Note: Gmail API needs to be enabled in Google Cloud Console
					// If this fails with a 403 SERVICE_DISABLED error, visit:
					// https://console.developers.google.com/apis/api/gmail.googleapis.com/overview
					const mails = await google
						.gmail({ version: 'v1', auth })
						.users.getProfile({ userId: 'me' });
					console.log('Google account is valid with Gmail access');
					console.log('mails', mails);

					// Also validate Calendar access
					// Calendar API also needs to be enabled in Google Cloud Console
					// https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview
					const calendar = await google.calendar({ version: 'v3', auth }).calendarList.list();
					console.log('Google account is valid with Calendar access');
					console.log('calendar', calendar);

					// Fetch upcoming meetings for the next 30 days
					try {
						// Get the user ID
						const userAccount = await db
							.select()
							.from(accounts)
							.where(sql`${accounts.providerAccountId} = ${account.providerAccountId}`);

						if (userAccount && userAccount.length > 0) {
							const userId = userAccount[0].userId;

							// Fetch calendar events
							const now = new Date();
							const timeMin = now.toISOString();
							const thirtyDaysLater = new Date(now);
							thirtyDaysLater.setDate(now.getDate() + 30);
							const timeMax = thirtyDaysLater.toISOString();

							const response = await google.calendar({ version: 'v3', auth }).events.list({
								calendarId: 'primary',
								timeMin,
								timeMax,
								singleEvents: true,
								orderBy: 'startTime'
							});

							const events = response.data.items || [];

							// Clear existing meetings first
							await db.delete(googleMeeting).where(sql`${googleMeeting.userId} = ${userId}`);

							// Insert new meetings
							const meetingsToInsert = events
								.filter((event) => !!event.id)
								.map((event) => ({
									userId,
									googleMeetingId: event.id || '',
									summary: event.summary || null,
									description: event.description || null,
									htmlLink: event.htmlLink || null,
									hangoutLink: event.hangoutLink || null,
									startTime: event.start?.dateTime
										? new Date(event.start.dateTime)
										: event.start?.date
											? new Date(event.start.date)
											: null,
									endTime: event.end?.dateTime
										? new Date(event.end.dateTime)
										: event.end?.date
											? new Date(event.end.date)
											: null,
									attendees: event.attendees || null,
									organizerEmail: event.organizer?.email || null,
									status: event.status || null,
									conferenceData: event.conferenceData || null,
									rawData: event
								}));

							if (meetingsToInsert.length > 0) {
								await db.insert(googleMeeting).values(meetingsToInsert);
							}

							// Update last fetched timestamp
							await db
								.update(users)
								.set({ lastUpdatedMeetings: now })
								.where(sql`${users.id} = ${userId}`);

							console.log(`Stored ${meetingsToInsert.length} Google calendar events for user`);
						}
					} catch (error) {
						console.error('Error fetching or storing Google Calendar events:', error);
						// Continue sign in even if we can't fetch calendar events
					}
				} catch (error) {
					console.error('Google API validation failed:', error);
					// Continue sign-in even if API validation fails
					// The user may not have enabled Gmail or Calendar API yet
				}
			}

			return true; // let sign-in continue
		}
	},
	trustHost: AUTH_TRUST_HOST === 'true'
});
