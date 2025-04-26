import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { SvelteKitAuth } from '@auth/sveltekit';
import LinkedIn from '@auth/sveltekit/providers/linkedin';
import Google from '@auth/sveltekit/providers/google';
import { AUTH_TRUST_HOST } from '$env/static/private';
import { accounts, db, sessions, users, verificationTokens } from '$lib/server/db/schema';

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
						'https://www.googleapis.com/auth/calendar',
						'https://www.googleapis.com/auth/calendar.readonly',
						'https://www.googleapis.com/auth/calendar.freebusy',
						'https://www.googleapis.com/auth/calendar.events',
						'https://www.googleapis.com/auth/calendar.events.readonly',
						'https://www.googleapis.com/auth/calendar.settings.readonly',
						'https://www.googleapis.com/auth/calendar.addons.execute',
						'https://www.googleapis.com/auth/calendar.addons.current.event.read',
						'https://www.googleapis.com/auth/calendar.addons.current.event.write',
						'https://www.googleapis.com/auth/calendar.events.owned',
						'https://www.googleapis.com/auth/calendar.events.owned.readonly',
						'https://www.googleapis.com/auth/calendar.events.freebusy',
						'https://www.googleapis.com/auth/calendar.app.created',
						'https://www.googleapis.com/auth/calendar.calendarlist',
						'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
						'https://www.googleapis.com/auth/calendar.calendars',
						'https://www.googleapis.com/auth/calendar.calendars.readonly',
						'https://www.googleapis.com/auth/calendar.acls',
						'https://www.googleapis.com/auth/calendar.acls.readonly',
						'https://www.googleapis.com/auth/calendar.events.public.readonly'
					].join(' ')
				}
			}
		})
	],
	trustHost: AUTH_TRUST_HOST === 'true'
});
