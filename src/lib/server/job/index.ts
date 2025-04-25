import { generateObject } from 'ai';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { embedText, gpt4o } from '$lib/server/ai';
import { generateJobPostEmbeddingInput } from '$lib/server/ai/format';
import { db } from '$lib/server/db';
import { candidates, jobPost, linkedInProfile, users } from '$lib/server/db/schema';
import { getFullLinkedinProfile } from '$lib/server/linkedin';
import { broadcastToUsersWithoutLocals } from '$lib/websocket/server.svelte';

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

		const [post, userIds] = await Promise.all([
			db
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
				.returning(),
			db.query.users.findMany({
				where: eq(users.organizationHandle, ownerOrganizationHandle)
			})
		]);

		broadcastToUsersWithoutLocals(
			userIds.map((user) => user.id),
			{
				messageType: `job-created`,
				data: post[0]
			}
		);

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
	eagerlyAdded: boolean = false,
	applied: boolean = false
) {
	try {
		const job = await db.query.jobPost.findFirst({
			where: eq(jobPost.id, jobId)
		});

		if (!job) {
			throw new Error(`Job with ID ${jobId} not found`);
		}

		const profileEntry = await db.query.linkedInProfile.findFirst({
			where: eq(linkedInProfile.handle, linkedinHandle)
		});

		let profileId: string;

		if (profileEntry) {
			profileId = profileEntry.id;
		} else {
			try {
				const profileData = await getFullLinkedinProfile(linkedinHandle);

				if (!profileData) {
					throw new Error('Failed to fetch LinkedIn profile');
				}

				const newProfile = await db
					.insert(linkedInProfile)
					.values({
						handle: linkedinHandle,
						data: profileData,
						expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
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
					throw new Error('Failed to create LinkedIn profile entry');
				}
				profileId = newProfile[0].id;
			} catch (error) {
				if (error instanceof Error && error.message.includes('linkedInProfile_handle_unique')) {
					// If it is, try to find the existing profile again, as it might have been created by a concurrent request
					const existingProfile = await db.query.linkedInProfile.findFirst({
						where: eq(linkedInProfile.handle, linkedinHandle)
					});
					if (existingProfile) {
						profileId = existingProfile.id;
						profileData = existingProfile.data;
						return createOrReturnCandidate(jobId, profileId, matchScore, reasoning, eagerlyAdded, applied);
					} else {
						return {
							error: `Failed to retrieve LinkedIn profile after conflict: ${linkedinHandle}`
						};
					}
				} else {
					return { error: `LinkedIn profile fetch failed: ${linkedinHandle}` };
				}
			}
		}

		// First create or get the candidate record
		const candidate = await createOrReturnCandidate(
			jobId,
			profileId,
			matchScore,
			reasoning,
			eagerlyAdded,
			applied
		);

		// After the candidate is created, calculate custom field values using the candidate ID
		if (candidate && job.customFields.length > 0) {
			// Check if candidate is not an error object
			if (!('error' in candidate)) {
				await calculateCustomFieldValues(jobId, candidate.id, profileData, userIds ?? []);
			}
		}

		return candidate;
	} catch (error) {
		throw new Error(
			`Failed to add candidate: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

async function createOrReturnCandidate(
	jobId: string,
	profileId: string,
	matchScore: number | undefined,
	reasoning: string | undefined,
	eagerlyAdded: boolean,
	applied: boolean
) {
	const [existingCandidate, job, profileData] = await Promise.all([
		db.query.candidates.findFirst({
			where: (candidates, { and }) =>
				and(eq(candidates.jobPostId, jobId), eq(candidates.linkedInProfileId, profileId)),
			with: {
				linkedInProfile: true
			}
		}),
		db.query.jobPost.findFirst({
			where: eq(jobPost.id, jobId)
		}),
		db.query.linkedInProfile.findFirst({
			where: eq(linkedInProfile.id, profileId)
		})
	]);

	if (existingCandidate) {
		return existingCandidate;
	}

	if (!job) {
		throw new Error('Job not found');
	}

	if (!profileData) {
		throw new Error(`LinkedIn profile with id ${profileId} not found`);
	}

	const [newCandidate, userIds] = await Promise.all([
		db
			.insert(candidates)
			.values({
				jobPostId: jobId,
				linkedInProfileId: profileId,
				matchScore: matchScore,
				reasoning: reasoning,
				eagerlyAdded: eagerlyAdded,
				applied: applied
			})
			.returning(),
		db.query.users.findMany({
			where: eq(users.organizationHandle, job.ownerOrganizationHandle ?? '')
		})
	]);

	if (!newCandidate || newCandidate.length === 0) {
		throw new Error('Failed to add candidate to job post');
	}

	const candidateForBroadcast = {
		...newCandidate[0],
		linkedInProfile: profileData
	};

	broadcastToUsersWithoutLocals(
		userIds.map((user) => user.id),
		{
			messageType: `${job.id}:candidate-added`,
			data: candidateForBroadcast
		}
	);

	return candidateForBroadcast;
}
