import { generateObject } from 'ai';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { embedText, gpt4o } from '$lib/server/ai';
import { generateJobPostEmbeddingInput } from '$lib/server/ai/format';
import { db } from '$lib/server/db';
import { candidates, jobPost, linkedInProfile } from '$lib/server/db/schema';
import { getFullLinkedinProfile } from '$lib/server/linkedin';

export interface JobData {
	title: string;
	description: string;
	department?: string;
	location?: string;
	type?: string;
	priority?: string;
	salary?: string;
	remote_policy?: string;
	responsibilities?: string;
	requirements?: string;
	benefits?: string;
	tech_stack?: string;
}
export async function insertJob(
	jobData: string,
	ownerOrganizationHandle: string,
	status?: 'archived' | 'draft' | 'published'
) {
	const { object } = await generateObject({
		model: gpt4o,
		schema: z.object({
			title: z.string(),
			description: z.string(),
			department: z.string().optional(),
			location: z.string().optional(),
			type: z.string().optional(),
			priority: z.string().optional(),
			salary: z.string().optional(),
			remote_policy: z.string().optional(),
			responsibilities: z.string().optional(),
			requirements: z.string().optional(),
			benefits: z.string().optional(),
			tech_stack: z.string().optional()
		}),
		prompt: `Extract the following information from the job description: ${jobData}. Please don't include any company information in the job description.`
	});

	const stringForVector = generateJobPostEmbeddingInput(object);
	const vector = await embedText(stringForVector);

	try {
		// Generate base handle from title
		let handle = object.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');

		// Check if handle+organization combination already exists
		const existingJob = await db.query.jobPost.findFirst({
			where: and(
				eq(jobPost.handle, handle),
				eq(jobPost.ownerOrganizationHandle, ownerOrganizationHandle)
			)
		});

		// If combination exists, add a 4-digit random number to handle
		if (existingJob) {
			const randomSuffix = Math.floor(1000 + Math.random() * 9000); // Ensures 4 digits (1000-9999)
			handle = `${handle}-${randomSuffix}`;
		}

		const post = await db
			.insert(jobPost)
			.values({
				handle,
				ownerOrganizationHandle,
				vector,
				title: object.title,
				description: object.description,
				department: object.department,
				location: object.location,
				type: object.type,
				status,
				priority: object.priority,
				salary: object.salary,
				remote_policy: object.remote_policy,
				responsibilities: object.responsibilities,
				requirements: object.requirements,
				benefits: object.benefits,
				tech_stack: object.tech_stack
			})
			.returning();

		return post[0];
	} catch (error) {
		throw new Error(
			`Failed to insert job: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

export async function addCandidate(
	linkedinHandle: string,
	jobId: string,
	matchScore?: number,
	reasoning?: string,
	eagerlyAdded: boolean = false
) {
	console.log(`Starting addCandidate process for ${linkedinHandle} to job ${jobId}`);
	try {
		const job = await db.query.jobPost.findFirst({
			where: eq(jobPost.id, jobId)
		});

		if (!job) {
			console.log(`Job with ID ${jobId} not found`);
			throw new Error(`Job with ID ${jobId} not found`);
		}
		console.log(`Found job: ${job.title}`);

		const profileEntry = await db.query.linkedInProfile.findFirst({
			where: eq(linkedInProfile.handle, linkedinHandle)
		});

		let profileId: string;

		if (profileEntry) {
			console.log(`Found existing LinkedIn profile for ${linkedinHandle}`);
			profileId = profileEntry.id;
		} else {
			console.log(`No existing profile found for ${linkedinHandle}, fetching from LinkedIn`);
			// Fetch profile data
			try {
				const profileData = await getFullLinkedinProfile(linkedinHandle);

				if (!profileData) {
					console.log(`Failed to fetch LinkedIn profile for ${linkedinHandle}`);
					throw new Error('Failed to fetch LinkedIn profile');
				}
				console.log(`Successfully fetched LinkedIn profile data for ${linkedinHandle}`);

				const newProfile = await db
					.insert(linkedInProfile)
					.values({
						handle: linkedinHandle,
						data: profileData,
						expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
					})
					.onConflictDoUpdate({
						target: linkedInProfile.handle,
						set: {
							data: profileData,
							expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
						}
					})
					.returning({ id: linkedInProfile.id });

				if (!newProfile || newProfile.length === 0) {
					console.log(`Failed to create LinkedIn profile entry for ${linkedinHandle}`);
					throw new Error('Failed to create LinkedIn profile entry');
				}
				profileId = newProfile[0].id;
				console.log(`Created new LinkedIn profile with ID ${profileId}`);
			} catch (error) {
				console.log(
					`Error fetching LinkedIn profile: ${error instanceof Error ? error.message : String(error)}`
				);
				// Check if the error is the unique constraint violation
				if (error instanceof Error && error.message.includes('linkedInProfile_handle_unique')) {
					// If it is, try to find the existing profile again, as it might have been created by a concurrent request
					const existingProfile = await db.query.linkedInProfile.findFirst({
						where: eq(linkedInProfile.handle, linkedinHandle)
					});
					if (existingProfile) {
						console.log(
							`Concurrent profile creation detected for ${linkedinHandle}, using existing profile ID ${existingProfile.id}`
						);
						profileId = existingProfile.id;
						// Jump to candidate creation logic
						return createOrReturnCandidate(
							jobId,
							profileId,
							matchScore,
							reasoning,
							eagerlyAdded,
							linkedinHandle
						);
					} else {
						// If profile still not found after the error, something else went wrong
						console.log(`Profile ${linkedinHandle} not found even after unique constraint error.`);
						return {
							error: `Failed to retrieve LinkedIn profile after conflict: ${linkedinHandle}`
						};
					}
				} else {
					// If it's another error, return the generic message
					return { error: `LinkedIn profile fetch failed: ${linkedinHandle}` };
				}
			}
		}

		// Moved candidate creation logic into a separate async function to handle reuse
		return createOrReturnCandidate(
			jobId,
			profileId,
			matchScore,
			reasoning,
			eagerlyAdded,
			linkedinHandle
		);
	} catch (error) {
		console.error(
			`Error in addCandidate: ${error instanceof Error ? error.message : String(error)}`
		);
		throw new Error(
			`Failed to add candidate: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

// Helper function to check/create candidate record
async function createOrReturnCandidate(
	jobId: string,
	profileId: string,
	matchScore: number | undefined,
	reasoning: string | undefined,
	eagerlyAdded: boolean,
	linkedinHandle: string // Pass handle for the final return object
) {
	// Check if candidate already exists for this job
	console.log(`Checking if candidate already exists for job ${jobId} and profile ${profileId}`);
	const existingCandidate = await db.query.candidates.findFirst({
		where: (candidates, { and }) =>
			and(eq(candidates.jobPostId, jobId), eq(candidates.linkedInProfileId, profileId)),
		with: {
			linkedInProfile: true
		}
	});

	if (existingCandidate) {
		console.log(`Candidate already exists for job ${jobId}, returning existing record`);
		return existingCandidate;
	}

	// Create new candidate entry
	console.log(`Creating new candidate entry with match score ${matchScore}`);
	const newCandidate = await db
		.insert(candidates)
		.values({
			jobPostId: jobId,
			linkedInProfileId: profileId,
			matchScore: matchScore,
			reasoning: reasoning,
			eagerlyAdded: eagerlyAdded
		})
		.returning();

	if (!newCandidate || newCandidate.length === 0) {
		console.log(`Failed to add candidate to job post ${jobId}`);
		throw new Error('Failed to add candidate to job post');
	}
	console.log(`Successfully added candidate with ID ${newCandidate[0].id}`);

	// Return the created candidate with profile information
	// We only have the handle readily available here, which is sufficient for the tool's output schema
	return {
		...newCandidate[0],
		linkedInProfile: { handle: linkedinHandle }
	};
}
