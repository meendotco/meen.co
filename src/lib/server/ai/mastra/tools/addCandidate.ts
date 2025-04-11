import { createTool } from '@mastra/core/tools';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/server/db';
import { candidates, jobPost, linkedInProfile } from '@/server/db/schema';
import { getFullLinkedinProfile } from '@/server/linkedin'; // Assuming this function exists and fetches the profile

export const addCandidateTool = createTool({
	id: 'add-candidate',
	description: 'Adds a potential candidate (from LinkedIn) to a specific job post.',
	inputSchema: z.object({
		job_id: z.string().describe('The ID of the job post to add the candidate to.'),
		linkedin_url: z.string().url().describe("The candidate's LinkedIn profile URL.")
	}),
	outputSchema: z.object({
		candidate_id: z.string().optional().describe('The ID of the newly created candidate entry.'),
		message: z.string().describe('A message indicating success or failure.')
	}),
	execute: async ({ context }) => {
		const { job_id, linkedin_url } = context;

		try {
			// 1. Check if Job Post exists
			const job = await db.query.jobPost.findFirst({
				where: eq(jobPost.id, job_id)
			});

			if (!job) {
				return { message: `Job post with ID ${job_id} not found.` };
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
					and(eq(candidates.jobPostId, job_id), eq(candidates.linkedInProfileId, profileId))
			});

			if (existingCandidate) {
				return {
					candidate_id: existingCandidate.id,
					message: 'Candidate already added to this job post.'
				};
			}

			// 4. Create Candidate entry
			const newCandidate = await db
				.insert(candidates)
				.values({
					jobPostId: job_id,
					linkedInProfileId: profileId
				})
				.returning({ id: candidates.id });

			if (!newCandidate || newCandidate.length === 0) {
				return { message: 'Failed to add candidate to job post.' };
			}

			return {
				candidate_id: newCandidate[0].id,
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

// Remove the old fetchLinkedinProfileTool if it existed in this file
// The edit tool should replace the entire file content
