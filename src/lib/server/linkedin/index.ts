import { Buffer } from 'buffer';
import { eq, not } from 'drizzle-orm';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import ProxycurlApi, { type PersonEndpointResponse } from 'proxycurl-js-linkedin-profile-scraper';

import { PROXYCURL_API_KEY } from '$env/static/private';
import { embedText } from '$lib/server/ai';
import { generateLinkedInProfileEmbeddingInput } from '$lib/server/ai/format';
import { db } from '$lib/server/db';

import { linkedInProfile } from '../db/schema';

const defaultClient = ProxycurlApi.ApiClient.instance;
const BearerAuth = defaultClient.authentications['BearerAuth'];
BearerAuth.accessToken = PROXYCURL_API_KEY;

export async function getFullLinkedinProfile(
	url: string = 'https://www.linkedin.com/in/makkadotgg/'
): Promise<PersonEndpointResponse> {
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
		return cache.data as PersonEndpointResponse;
	}
	let profile: PersonEndpointResponse | null = null;

	try {
		profile = await new Promise<PersonEndpointResponse>((resolve, reject) => {
			apiInstance.personProfileEndpoint(
				url,
				fallbackToCache,
				opts,
				(error: unknown, data: PersonEndpointResponse | null) => {
					if (error) {
						reject(error);
					} else if (data) {
						resolve(data);
					} else {
						reject(new Error('No data received from Proxycurl API'));
					}
				}
			);
		});
	} catch {
		return { full_name: 'Profile not found' } as PersonEndpointResponse;
	}

	const textToEmbed = generateLinkedInProfileEmbeddingInput(profile);
	const vector = await embedText(textToEmbed);

	let profileImageB64: string | null = null;
	if (profile.profile_pic_url) {
		const response = await fetch(profile.profile_pic_url);
		if (response.ok) {
			const imageBuffer = await response.arrayBuffer();
			profileImageB64 = Buffer.from(imageBuffer).toString('base64');
		}
	}

	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

	await db
		.insert(linkedInProfile)
		.values({
			url,
			data: profile,
			profileImageB64,
			vector,
			expiresAt
		})
		.onConflictDoUpdate({
			target: linkedInProfile.url,
			set: {
				data: profile,
				profileImageB64,
				vector: vector,
				expiresAt: expiresAt,
				updatedAt: new Date()
			}
		});

	return profile;
}

export async function searchLinkedin(query: string) {
	const embedding = await embedText(query);

	const similarity = sql<number>`1 - (${cosineDistance(linkedInProfile.vector, embedding)})`;

	const candidates = await db
		.select({
			id: linkedInProfile.id,
			data: linkedInProfile.data,
			url: linkedInProfile.url,
			similarity
		})
		.from(linkedInProfile)
		.where(gt(similarity, 0.0))
		.orderBy((t) => desc(t.similarity))
		.limit(10);

	const data = candidates.map((candidate) => {
		return candidate.data as PersonEndpointResponse;
	});

	const formattedData = data.map((candidate) => {
		return generateLinkedInProfileEmbeddingInput(candidate);
	});

	return {
		results: formattedData
	};
}

export async function searchLinkedinForObject(query: string) {
	const embedding = await embedText(query);

	const similarity = sql<number>`1 - (${cosineDistance(linkedInProfile.vector, embedding)})`;

	const candidates = await db
		.select({
			id: linkedInProfile.id,
			data: linkedInProfile.data,
			url: linkedInProfile.url,
			similarity
		})
		.from(linkedInProfile)
		.where(gt(similarity, 0.0))
		.orderBy((t) => desc(t.similarity))
		.limit(2);

	console.log(candidates.map((candidate) => (candidate.data as PersonEndpointResponse).full_name));

	return candidates;
}
