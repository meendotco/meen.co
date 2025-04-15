import { createTool } from '@mastra/core/tools';
import type { PersonEndpointResponse } from 'proxycurl-js-linkedin-profile-scraper';
import { z } from 'zod';

import { getFullLinkedinProfile } from '@/server/linkedin';

export async function createFetchLinkedinProfileTool() {
	return createTool({
		id: 'fetch-linkedin-profile',
		description: `Fetch a LinkedIn profile using a profile handle.`,
		inputSchema: z.object({
			handle: z
				.string()
				.describe(
					'LinkedIn profile handle in the format. For example: makkadotgg. If the url is https://www.linkedin.com/in/username/. The handle will be username.'
				)
		}),
		outputSchema: z.object({
			result: z.object({
				profile: z.any().describe('LinkedIn profile data')
			})
		}),
		execute: async ({ context }) => {
			const profileText = await fetchLinkedinProfile(context.handle);
			return { result: { profile: profileText } };
		}
	});
}

const fetchLinkedinProfile = async (handle: string) => {
	const profile: PersonEndpointResponse = await getFullLinkedinProfile(handle);
	return profile;
};
