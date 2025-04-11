import { createTool } from '@mastra/core/tools';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/server/db';
import { candidates, jobPost, linkedInProfile } from '@/server/db/schema';
import { getFullLinkedinProfile } from '@/server/linkedin';

export async function createAddCandidateTool(job: typeof jobPost.$inferSelect) {
	return createTool({
		id: 'add-candidate',
		description: 'Adds a potential candidate (from LinkedIn) to a specific job post.',
		inputSchema: z.object({
			linkedin_url: z.string().describe("The candidate's LinkedIn profile URL."),
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
			const { linkedin_url } = context;
			const { match_score, reasoning } = context;

			console.log('adding candidate: ' + linkedin_url);
			try {
				if (!job || !job.id) {
					return { message: `No Job Post Found` };
				}

				// 2. Find or Create LinkedIn Profile entry
				const profileEntry = await db.query.linkedInProfile.findFirst({
					where: eq(linkedInProfile.url, linkedin_url)
				});

				let profileId: string;

				if (profileEntry) {
					profileId = profileEntry.id;
				} else {
					// Fetch profile data (assuming getFullLinkedinProfile returns necessary data)
					// TODO: Handle potential errors from getFullLinkedinProfile
					const profileData = await getFullLinkedinProfile(linkedin_url);

					// TODO: Add proper error handling and potentially calculate vector/expiresAt
					const newProfile = await db
						.insert(linkedInProfile)
						.values({
							url: linkedin_url,
							data: profileData, // Assuming profileData is the JSON data
							// expiresAt needs to be set appropriately, e.g., 30 days from now
							expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Example: 30 days expiry
						})
						.returning({ id: linkedInProfile.id });

					if (!newProfile || newProfile.length === 0) {
						return { message: 'Failed to create LinkedIn profile entry in database.' };
					}
					profileId = newProfile[0].id;
				}

				// 3. Check if candidate already exists for this job
				const existingCandidate = await db.query.candidates.findFirst({
					where: (candidates, { and }) =>
						and(eq(candidates.jobPostId, job.id), eq(candidates.linkedInProfileId, profileId)),
					with: {
						linkedInProfile: true
					}
				});

				if (existingCandidate) {
					return {
						candidate_id: existingCandidate.id,
						candidate_url: existingCandidate.linkedInProfile.url,
						message: 'Candidate already added to this job post.'
					};
				}

				// 4. Create Candidate entry
				const newCandidate = await db
					.insert(candidates)
					.values({
						jobPostId: job.id,
						linkedInProfileId: profileId,
						matchScore: match_score,
						reasoning: reasoning
					})
					.returning({ id: candidates.id });

				if (!newCandidate || newCandidate.length === 0) {
					return { message: 'Failed to add candidate to job post.' };
				}

				return {
					candidate_id: newCandidate[0].id,
					candidate_url: linkedin_url,
					message: 'Successfully added candidate to job post.'
				};
			} catch (error) {
				// Provide a more generic error message to the tool output
				return {
					message: `An error occurred while adding the candidate: ${error instanceof Error ? error.message : 'Unknown error'}`
				};
			}
		}
	});
}
