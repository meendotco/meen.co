import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { jobPost } from '@/server/db/schema';
import { addCandidate } from '@/server/job';

export async function createAddCandidateTool(job: typeof jobPost.$inferSelect) {
	return createTool({
		id: 'add-candidate',
		description: 'Adds a potential candidate (from LinkedIn) to a specific job post.',
		inputSchema: z.object({
			linkedin_url: z
				.string()
				.describe(
					"The candidate's LinkedIn profile URL. For example: https://www.linkedin.com/in/makkadotgg/"
				),
			match_score: z.number().describe('The match score of the candidate to the job post.'),
			reasoning: z
				.string()
				.describe('The reasoning why this candidate is a potential match for the job.')
		}),
		outputSchema: z.object({
			candidate_id: z.string().optional().describe('The ID of the newly created candidate entry.'),
			candidate_url: z.string().optional().describe('The LinkedIn URL of the candidate.'),
			message: z.string().describe('A message indicating success or failure.')
		}),
		execute: async ({ context }) => {
			const { linkedin_url, match_score, reasoning } = context;
			try {
				if (!job || !job.id) {
					console.log('No Job Post Found');
					return { message: `No Job Post Found` };
				}

				console.log('Adding candidate to job post', linkedin_url, job.id, match_score, reasoning);
				const candidate = await addCandidate(linkedin_url, job.id, match_score, reasoning);

				// Check if addCandidate returned an error object
				if ('error' in candidate && candidate.error) {
					return { message: `Failed to add candidate: ${candidate.error}` };
				}

				// Check if candidate has an ID (TypeScript guard)
				if (!('id' in candidate)) {
					return {
						message: 'Failed to add candidate: Unexpected response from addCandidate function.'
					};
				}

				return {
					candidate_id: candidate.id,
					candidate_url: linkedin_url,
					message: 'Successfully added candidate to job post.'
				};
			} catch (error) {
				return {
					message: `An error occurred while adding the candidate: ${error instanceof Error ? error.message : 'Unknown error'}`
				};
			}
		}
	});
}
