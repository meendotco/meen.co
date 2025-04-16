import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { searchLinkedin } from '@/server/linkedin';

export async function createSearchLinkedinTool() {
	return createTool({
		id: 'search-linkedin',
		description: 'Search for candidates on LinkedIn',
		inputSchema: z.object({
			query: z.string().describe('Search query'),
			k: z.number().describe('Number of results to return')
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
