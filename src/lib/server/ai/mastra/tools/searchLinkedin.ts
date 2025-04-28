import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { searchLinkedin } from '@/server/linkedin';

export async function createSearchLinkedinTool() {
	return createTool({
		id: 'search-linkedin',
		description:
			'Perform semantic vector search on LinkedIn profiles to find candidates matching specific skills, job titles, or qualifications. This uses embedding similarity, not keyword matching.',
		inputSchema: z.object({
			query: z
				.string()
				.describe(
					'Natural language description of the ideal candidate profile. Include relevant skills, experience levels, or job titles. The vector search will find semantic matches beyond exact keywords.'
				),
			k: z
				.number()
				.describe(
					'Number of semantically similar profiles to return (recommend 5-15 for high relevance). Higher values increase recall but may reduce precision in vector space.'
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
