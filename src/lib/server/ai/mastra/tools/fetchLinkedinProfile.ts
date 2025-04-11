import { createTool } from '@mastra/core/tools';
import type { PersonEndpointResponse } from 'proxycurl-js-linkedin-profile-scraper';
import { z } from 'zod';

import { getFullLinkedinProfile } from '@/server/linkedin';

export const fetchLinkedinProfileTool = createTool({
	id: 'fetch-linkedin-profile',
	description: 'Fetch a LinkedIn profile',
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

const fetchLinkedinProfile = async (url: string) => {
	const profile: PersonEndpointResponse = await getFullLinkedinProfile(url);
	return profile;
};
