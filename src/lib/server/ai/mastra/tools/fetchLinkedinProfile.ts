import { createTool } from '@mastra/core/tools';
import type { PersonEndpointResponse } from 'proxycurl-js-linkedin-profile-scraper';
import { z } from 'zod';

import { getFullLinkedinProfile } from '@/server/linkedin';

export async function createFetchLinkedinProfileTool() {
	return createTool({
		id: 'fetch-linkedin-profile',
		description: `Fetch a LinkedIn profile. Has to be in this format: https://www.linkedin.com/in/your-linkedin-profile-url/.
        If you have found a post for example this.: https://www.linkedin.com/posts/nils-alstad-80794110_were-looking-for-interns-we-are-currently-activity-7257261100079960064--L_2
        The profile url would be: https://www.linkedin.com/in/nils-alstad-80794110/
        `,
		inputSchema: z.object({
			url: z.string().describe('LinkedIn profile URL')
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
