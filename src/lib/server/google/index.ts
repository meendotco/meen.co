import { google } from 'googleapis';

import { accounts } from '@/server/db/schema';
import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
// import { AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET } from '$env/static/private';
import { AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET } from '$env/static/private';

export { GoogleService } from './service';

export async function getGoogleAuthClient(userId: string) {
	const account = await db.query.accounts.findFirst({
		where: and(eq(accounts.userId, userId), eq(accounts.provider, 'google')),
		columns: {
			userId: true,
			provider: true,
			providerAccountId: true,
			access_token: true,
			refresh_token: true,
			expires_at: true
		}
	});

	if (!account || !account.provider || !account.providerAccountId) {
		throw new Error('Google account, provider, or providerAccountId not found for user.');
	}

	if (!account.access_token) {
		throw new Error('No access token found for Google account');
	}

	const oauth2Client = new google.auth.OAuth2(AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET);

	// Restore the setting of credentials on the main client
	oauth2Client.setCredentials({
		access_token: account.access_token,
		refresh_token: account.refresh_token,
		expiry_date: account.expires_at ? account.expires_at * 1000 : undefined
	});

	// Remove the validation logic added here - it should stay in auth.ts
	// const auth = new google.auth.OAuth2();
	// auth.setCredentials({ access_token: account.access_token });
	// ... validation calls ...

	const expiryDate = account.expires_at ? account.expires_at * 1000 : 0;
	const needsRefresh = expiryDate < Date.now() + 5 * 60 * 1000;

	if (needsRefresh && account.refresh_token) {
		console.log(`Google token for user ${userId} needs refresh. Attempting refresh.`);
		try {
			const { credentials } = await oauth2Client.refreshAccessToken();
			console.log(`Google token for user ${userId} refreshed successfully.`);

			oauth2Client.setCredentials(credentials);

			await db
				.update(accounts)
				.set({
					access_token: credentials.access_token,
					expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
					refresh_token: credentials.refresh_token ?? account.refresh_token
				})
				.where(
					and(
						eq(accounts.provider, account.provider),
						eq(accounts.providerAccountId, account.providerAccountId)
					)
				);

			console.log(`Database updated with new Google token for user ${userId}.`);
		} catch (error) {
			console.error(`Error refreshing Google access token for user ${userId}:`, error);
			throw new Error(`Failed to refresh Google access token: ${(error as Error).message}`);
		}
	} else if (needsRefresh && !account.refresh_token) {
		console.warn(`Google token for user ${userId} expired, but no refresh token available.`);
		throw new Error('Google token expired and no refresh token available.');
	}

	return oauth2Client;
}
