import { eq } from 'drizzle-orm';
import ProxycurlApi from 'proxycurl-js-linkedin-profile-scraper';

import { PROXYCURL_API_KEY } from '$env/static/private';
import { db } from '$lib/server/db';

import { proxyCurlCache } from '../db/schema';

const defaultClient = ProxycurlApi.ApiClient.instance;
// Configure Bearer access token for authorization: BearerAuth
const BearerAuth = defaultClient.authentications['BearerAuth'];
BearerAuth.accessToken = PROXYCURL_API_KEY;

export async function getFullLinkedinProfile(
	url: string = 'https://www.linkedin.com/in/makkadotgg/'
) {
	try {
		const apiInstance = new ProxycurlApi.PeopleAPIApi();
		const fallbackToCache = 'on-error';
		const opts = {
			useCache: 'if-present',
			skills: 'include',
			inferredSalary: 'include',
			personalEmail: 'include',
			personalContactNumber: 'include',
			twitterProfileId: 'include',
			facebookProfileId: 'include',
			githubProfileId: 'include',
			extra: 'include'
		};

		const cache = await db.query.proxyCurlCache.findFirst({
			where: eq(proxyCurlCache.url, url)
		});

		if (cache) {
			return cache.data;
		}

		// Use promise-based approach without calling .end()
		const profile = await new Promise((resolve, reject) => {
			apiInstance.personProfileEndpoint(url, fallbackToCache, opts, (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			});
		});

		await db.insert(proxyCurlCache).values({
			url,
			data: profile,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
		});

		return profile;
	} catch (error) {
		console.error('Error in getFullLinkedinProfile:', error);
		throw error;
	}
}
