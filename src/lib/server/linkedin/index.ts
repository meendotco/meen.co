import { eq } from 'drizzle-orm';
import ProxycurlApi from 'proxycurl-js-linkedin-profile-scraper';

import { PROXYCURL_API_KEY } from '$env/static/private';
import { db } from '$lib/server/db';

import { linkedInProfile } from '../db/schema';

const defaultClient = ProxycurlApi.ApiClient.instance;
const BearerAuth = defaultClient.authentications['BearerAuth'];
BearerAuth.accessToken = PROXYCURL_API_KEY;

export async function getFullLinkedinProfile(
	url: string = 'https://www.linkedin.com/in/makkadotgg/'
) {
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

	const cache = await db.query.linkedInProfile.findFirst({
		where: eq(linkedInProfile.url, url)
	});

	if (cache) {
		return cache.data;
	}

	const profile = await new Promise((resolve, reject) => {
		apiInstance.personProfileEndpoint(url, fallbackToCache, opts, (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(data);
			}
		});
	});

	await db.insert(linkedInProfile).values({
		url,
		data: profile,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	});

	return profile;
}
