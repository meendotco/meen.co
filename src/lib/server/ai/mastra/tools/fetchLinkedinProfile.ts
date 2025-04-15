import { createTool } from '@mastra/core/tools';
import type { PersonEndpointResponse } from 'proxycurl-js-linkedin-profile-scraper';
import { z } from 'zod';

import { getFullLinkedinProfile } from '@/server/linkedin';

export async function createFetchLinkedinProfileTool() {
	return createTool({
		id: 'fetch-linkedin-profile',
		description: `Fetch a LinkedIn profile using a profile URL.
		
		The URL must be in the format: https://www.linkedin.com/in/username/
		
		For example, if you find a LinkedIn post URL like:
		https://www.linkedin.com/posts/nils-alstad-80794110_were-looking-for-interns-activity-7257261100079960064--L_2
		
		Extract just the profile portion to get:
		https://www.linkedin.com/in/nils-alstad-80794110/
		
		Always use the /in/ format for profile URLs.`,
		inputSchema: z.object({
			url: z
				.string()
				.describe('LinkedIn profile URL in the format https://www.linkedin.com/in/username/')
		}),
		outputSchema: z.object({
			result: z.object({
				profile: z.any().describe('LinkedIn profile data')
			})
		}),
		execute: async ({ context }) => {
			const profileText = await fetchLinkedinProfile(context.url);
			return { result: { profile: profileText } };
		}
	});
}

const fetchLinkedinProfile = async (url: string) => {
	console.log('fetching profile: ' + url);
	const profile: PersonEndpointResponse = await getFullLinkedinProfile(url);
	return profile;
};
