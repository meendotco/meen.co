import { generateObject } from 'ai';
import { eq } from 'drizzle-orm';
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
	userId: string,
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
		const post = await db
			.insert(jobPost)
			.values({
				handle: object.title,
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
				return { error: `LinkedIn profile not found: ${linkedinHandle}` };
			}
		}

		// Check if candidate already exists for this job
		console.log(`Checking if candidate already exists for job ${jobId}`);
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
		return {
			...newCandidate[0],
			linkedInProfile: { handle: linkedinHandle }
		};
	} catch (error) {
		console.error(
			`Error in addCandidate: ${error instanceof Error ? error.message : String(error)}`
		);
		throw new Error(
			`Failed to add candidate: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
