import { createTool } from '@mastra/core/tools';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import type { PersonEndpointResponse } from 'proxycurl-js-linkedin-profile-scraper';
import { z } from 'zod';

import { embedText } from '@/server/ai';
import { db } from '@/server/db';
import { linkedInProfile } from '@/server/db/schema';

export async function createSearchLinkedinTool() {
	return createTool({
		id: 'search-linkedin',
		description: 'Search for candidates on LinkedIn',
		inputSchema: z.object({
			query: z.string().describe('Search query')
		}),
		outputSchema: z.object({
			results: z.array(z.string())
		}),
		execute: async ({ context }) => {
			return await searchLinkedin(context.query);
		}
	});
}

const searchLinkedin = async (query: string) => {
	const embedding = await embedText(query);
	console.log('searching for: ' + query);

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
		.limit(4);

	const data = candidates.map((candidate) => {
		return candidate.data as PersonEndpointResponse;
	});

	const formattedResults = data.map((candidate) => {
		return `Candidate: ${candidate.full_name}
Position: ${candidate.headline || 'N/A'}
Location: ${candidate.country || 'N/A'}
Handle: ${candidate.public_identifier || 'N/A'}
Experience: ${candidate.experiences?.join(', ') || 'N/A'}
Skills: ${candidate.skills?.join(', ') || 'N/A'}
URL: https://www.linkedin.com/in/${candidate.public_identifier}
People also search for: ${candidate.people_also_viewed?.join(', ') || 'N/A'}
`;
	});

	return {
		results: formattedResults
	};
};
