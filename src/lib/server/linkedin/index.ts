import { Buffer } from 'buffer';
import { eq } from 'drizzle-orm';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import ProxycurlApi, { type PersonEndpointResponse } from 'proxycurl-js-linkedin-profile-scraper';

import { PROXYCURL_API_KEY } from '$env/static/private';
import { embedText } from '$lib/server/ai';
import { generateLinkedInProfileEmbeddingInput } from '$lib/server/ai/format';
import { db } from '$lib/server/db';
import { searchGoogle } from '$lib/server/search';

import { linkedInProfile } from '../db/schema';

const defaultClient = ProxycurlApi.ApiClient.instance;
const BearerAuth = defaultClient.authentications['BearerAuth'];
BearerAuth.accessToken = PROXYCURL_API_KEY;

export async function getFullLinkedinProfile(
	handle: string = 'makkadotgg'
): Promise<PersonEndpointResponse> {
	try {
		// Check if profile exists in database first using the handle
		const cache = await db.query.linkedInProfile.findFirst({
			where: eq(linkedInProfile.handle, handle)
		});

		// If profile exists in cache, return it immediately without fetching
		if (cache) {
			console.log(`Using cached LinkedIn profile for ${handle}`);
			return cache.data as PersonEndpointResponse;
		}

		// Construct the full LinkedIn profile URL
		const profileUrl = `https://www.linkedin.com/in/${handle}`;

		// Profile not in cache, fetch from Proxycurl API using the URL
		console.log(`Fetching LinkedIn profile for ${handle} (${profileUrl}) from API`);
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

		let profile: PersonEndpointResponse | null = null;

		try {
			profile = await new Promise<PersonEndpointResponse>((resolve, reject) => {
				// Call the endpoint with the URL as the first argument
				apiInstance.personProfileEndpoint(
					profileUrl, // Correct position for the URL
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
		} catch (error) {
			throw new Error(
				`Failed to fetch LinkedIn profile: ${error instanceof Error ? error.message : String(error)}`
			);
		}

		const textToEmbed = generateLinkedInProfileEmbeddingInput(profile);
		const vector = await embedText(textToEmbed);

		let profileImageB64: string | null = null;
		if (profile.profile_pic_url) {
			try {
				const response = await fetch(profile.profile_pic_url);
				if (response.ok) {
					const imageBuffer = await response.arrayBuffer();
					profileImageB64 = Buffer.from(imageBuffer).toString('base64');
				}
			} catch (error) {
				console.error(
					`Failed to fetch profile image: ${error instanceof Error ? error.message : String(error)}`
				);
				// Continue without the image
			}
		}

		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

		try {
			await db
				.insert(linkedInProfile)
				.values({
					handle, // Store using the original handle for consistency
					data: profile,
					profileImageB64,
					vector,
					expiresAt
				})
				.onConflictDoUpdate({
					target: linkedInProfile.handle,
					set: {
						data: profile,
						profileImageB64,
						vector: vector,
						expiresAt: expiresAt,
						updatedAt: new Date()
					}
				});
		} catch (dbError: unknown) {
			// Type guard to check if it's an object with a 'code' property
			const potentialDbError = dbError as { code?: number | string };

			// Check if the error is a unique constraint violation (PostgreSQL code 23505)
			if (potentialDbError?.code === '23505') {
				console.warn(
					`Unique constraint violation for handle ${handle} during insert/update. Fetching existing profile.`
				);
				const existingProfile = await db.query.linkedInProfile.findFirst({
					where: eq(linkedInProfile.handle, handle)
				});
				if (existingProfile) {
					return existingProfile.data as PersonEndpointResponse;
				} else {
					// This case should ideally not happen if 23505 was thrown, but handle it just in case
					console.error(
						`Unique constraint violation for ${handle}, but failed to fetch existing profile.`
					);
					throw new Error(
						`Failed to process LinkedIn profile ${handle} after unique constraint error.`
					);
				}
			} else {
				// Re-throw other database errors
				console.error(
					`Database error during LinkedIn profile insert/update for ${handle}: ${dbError instanceof Error ? dbError.message : String(dbError)}`
				);
				throw dbError;
			}
		}

		return profile;
	} catch (error) {
		console.error(
			`Error in getFullLinkedinProfile: ${error instanceof Error ? error.message : String(error)}`
		);
		throw new Error(
			`Failed to process LinkedIn profile: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
export async function searchLinkedinGoogle(query: string) {
	try {
		const results = await searchGoogle(`site:linkedin.com ${query}`);
		const extractedProfiles = [];

		if (results && results.items && Array.isArray(results.items)) {
			for (const item of results.items) {
				const profileInfo = {
					name: '',
					link: item.link || '',
					snippet: item.snippet || '',
					title: item.title || ''
				};
				if (item.title) {
					const titleParts = item.title.split(' - ');
					if (titleParts.length > 0) {
						profileInfo.name = titleParts[0].trim();
					}
				}
				if (
					profileInfo.link.includes('linkedin.com/in/') ||
					(profileInfo.name && !profileInfo.name.includes('LinkedIn'))
				) {
					extractedProfiles.push(profileInfo);
				}
			}
		}

		const formattedProfiles = extractedProfiles.map((profile) => {
			return `<GoogleSearchResult><name>${profile.name}</name>\nLink: ${profile.link}\nTitle: ${profile.title}\nSnippet: ${profile.snippet}</GoogleSearchResult>`;
		});

		return {
			profiles: formattedProfiles
		};
	} catch (error) {
		console.error(
			`Error in searchLinkedinGoogle: ${error instanceof Error ? error.message : String(error)}`
		);
		throw new Error(
			`Failed to search LinkedIn profiles: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
export async function searchLinkedin(query: string, k: number = 10) {
	try {
		const embedding = await embedText(query);

		const similarity = sql<number>`1 - (${cosineDistance(linkedInProfile.vector, embedding)})`;

		const candidates = await db
			.select({
				id: linkedInProfile.id,
				data: linkedInProfile.data,
				handle: linkedInProfile.handle,
				similarity
			})
			.from(linkedInProfile)
			.where(gt(similarity, 0.0))
			.orderBy((t) => desc(t.similarity))
			.limit(k);

		const data = candidates.map((candidate) => {
			return candidate.data as PersonEndpointResponse;
		});

		const googleResults = await searchLinkedinGoogle(query);

		const formattedData = data.map((candidate) => {
			return generateLinkedInProfileEmbeddingInput(candidate);
		});

		const totalData = [...formattedData, ...googleResults.profiles];

		return {
			results: totalData
		};
	} catch (error) {
		console.error(
			`Error in searchLinkedin: ${error instanceof Error ? error.message : String(error)}`
		);
		throw new Error(
			`Failed to search LinkedIn profiles: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

export async function searchLinkedinForObject(query: string) {
	try {
		const embedding = await embedText(query);

		const similarity = sql<number>`1 - (${cosineDistance(linkedInProfile.vector, embedding)})`;

		const candidates = await db
			.select({
				id: linkedInProfile.id,
				data: linkedInProfile.data,
				handle: linkedInProfile.handle,
				similarity
			})
			.from(linkedInProfile)
			.where(gt(similarity, 0.0))
			.orderBy((t) => desc(t.similarity))
			.limit(2);

		console.log(
			candidates.map((candidate) => (candidate.data as PersonEndpointResponse).full_name)
		);
		return candidates;
	} catch (error) {
		console.error(
			`Error in searchLinkedinForObject: ${error instanceof Error ? error.message : String(error)}`
		);
		throw new Error(
			`Failed to search LinkedIn profiles for object: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
