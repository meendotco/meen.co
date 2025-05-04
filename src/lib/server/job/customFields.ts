import { generateObject } from 'ai';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import {
	generateJobPostEmbeddingInput,
	generateLinkedInProfileEmbeddingInput
} from '$lib/server/ai/format';
import { gpt41, o3Mini } from '$lib/server/ai';
import { db } from '$lib/server/db';
import { candidates, customFieldValue, jobPost } from '$lib/server/db/schema';
import { broadcastToUsersWithoutLocals } from '$lib/websocket/server.svelte';
import { v4 as uuidv4 } from 'uuid';

interface CandidateData {
	id: string;
	profileData: any;
}

export async function calculateCustomFieldValuesForBatch(
	jobId: string,
	candidates: CandidateData[],
	userIds: string[],
	batchSize: number = 10
) {
	const job = await db.query.jobPost.findFirst({
		where: eq(jobPost.id, jobId),
		with: {
			customFields: true
		}
	});

	if (!job) {
		throw new Error(`Job with ID ${jobId} not found`);
	}

	// Process candidates in batches
	for (let i = 0; i < candidates.length; i += batchSize) {
		const batch = candidates.slice(i, i + batchSize);
		console.log(
			`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(candidates.length / batchSize)}`
		);

		// Process each candidate in the current batch
		const results = await Promise.allSettled(
			batch.map(async (candidate) => {
				console.log(`Generating values for candidate: ${candidate.id}`);
				await calculateCustomFieldValuesForCandidate(
					job,
					candidate.id,
					candidate.profileData,
					userIds
				);
				return candidate.id;
			})
		);

		// Log any errors
		results.forEach((result, index) => {
			if (result.status === 'rejected') {
				console.error(`Failed to process candidate ${batch[index].id}:`, result.reason);
			} else {
				console.log(`Completed values for candidate ${result.value}`);
			}
		});
	}
}

async function calculateCustomFieldValuesForCandidate(
	job: any,
	candidateId: string,
	profileData: any,
	userIds: string[]
) {
	// First verify the candidate exists
	const candidateExists = await db.query.candidates.findFirst({
		where: eq(candidates.id, candidateId)
	});

	if (!candidateExists) {
		throw new Error(
			`Cannot create custom field values: Candidate with ID ${candidateId} not found`
		);
	}

	for (const customField of job.customFields) {
		try {
			// Check if a value already exists for this candidate and custom field
			const existingValue = await db.query.customFieldValue.findFirst({
				where: and(
					eq(customFieldValue.candidateId, candidateId),
					eq(customFieldValue.customFieldId, customField.id)
				)
			});

			// Skip if value already exists
			if (existingValue) {
				console.log(
					`Skipping existing custom field value for candidate ${candidateId} and field ${customField.id}`
				);
				continue;
			}

			const prompt = `
<task>
  Generate a human-readable value for the custom field "${customField.name}" (${customField.description}) for this candidate based on their LinkedIn profile.
  Ensure the output includes both the value and a clear, human-readable reasoning for how that value was determined.
</task>

<job_description>
${generateJobPostEmbeddingInput({
	title: job.title,
	description: job.description,
	department: job.department as string | undefined,
	location: job.location as string | undefined,
	type: job.type as string | undefined,
	priority: job.priority as string | undefined,
	salary: job.salary as string | undefined,
	remote_policy: job.remote_policy as string | undefined,
	responsibilities: job.responsibilities as string | undefined,
	requirements: job.requirements as string | undefined,
	benefits: job.benefits as string | undefined,
	tech_stack: job.tech_stack as string | undefined
})}
</job_description>

<candidate_profile>
${generateLinkedInProfileEmbeddingInput(profileData)}
</candidate_profile>

<output_requirements>
  Ensure the output is clear, concise, and easily understood by humans.
</output_requirements>
`;
			const value = await generateObject({
				model: gpt41,
				schema: z.object({
					value:
						customField.type === 'boolean'
							? z.boolean()
							: customField.type === 'number'
								? z.number()
								: customField.type === 'date'
									? z.string().datetime()
									: z.string(),
					reasoning: z.string()
				}),
				prompt: prompt
			});

			// Insert new value
			console.log(
				`Creating new custom field value for candidate ${candidateId} and field ${customField.id}`
			);
			const [valueToBroadcast] = await db
				.insert(customFieldValue)
				.values({
					id: uuidv4(),
					customFieldId: customField.id,
					candidateId: candidateId,
					value: String(value.object.value),
					reasoning: value.object.reasoning
				})
				.returning();

			// Fetch the value with its relation to send complete data
			if (valueToBroadcast) {
				const valueWithRelations = await db.query.customFieldValue.findFirst({
					where: eq(customFieldValue.id, valueToBroadcast.id),
					with: {
						customField: true // Ensure the nested customField is included
					}
				});

				if (valueWithRelations) {
					broadcastToUsersWithoutLocals(userIds, {
						messageType: `${job.id}.customFieldValueCreated`, // Use job-specific channel
						data: {
							customFieldValue: valueWithRelations
						}
					});
				}
			}
		} catch (error) {
			console.error(
				`Error processing custom field ${customField.id} for candidate ${candidateId}:`,
				error
			);
			throw error; // Re-throw to be caught by the caller
		}
	}
}

// For backward compatibility and single candidate use cases
export async function calculateCustomFieldValues(
	jobId: string,
	candidateId: string,
	profileData: any,
	userIds: string[]
) {
	try {
		console.log(`Calculating custom field values for candidate ${candidateId} in job ${jobId}`);

		const job = await db.query.jobPost.findFirst({
			where: eq(jobPost.id, jobId),
			with: {
				customFields: true
			}
		});

		if (!job) {
			throw new Error(`Job with ID ${jobId} not found`);
		}

		await calculateCustomFieldValuesForCandidate(job, candidateId, profileData, userIds);
		console.log(`Successfully calculated custom field values for candidate ${candidateId}`);
	} catch (error) {
		console.error(`Failed to calculate custom field values:`, error);
		throw error;
	}
}
