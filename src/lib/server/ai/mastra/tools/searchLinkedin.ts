import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { searchLinkedin } from '@/server/linkedin';

export async function createSearchLinkedinTool() {
	return createTool({
		id: 'search-linkedin',
		description:
			'Search for LinkedIn profiles matching specific skills, job titles, or qualifications.',
		inputSchema: z.object({
			query: z
				.string()
				.describe(
					'Specific search terms related to skills, experience, or job titles. Focus on professional attributes rather than company names.'
				),
			k: z
				.number()
				.describe(
					'Maximum number of results to return (recommend 10-20 for quality results). Use smaller, targeted searches for better precision.'
				)
		}),
		outputSchema: z.object({
			results: z.array(z.string())
		}),
		execute: async ({ context }) => {
			console.log('searchLinkedin', context.query, context.k);
			return await searchLinkedin(context.query, context.k);
		}
	});
}
