import { json } from '@sveltejs/kit';
import { generateObject } from 'ai';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import {
	generateLinkedInProfileEmbeddingInput,
	generateJobPostEmbeddingInput
} from '@/server/ai/format/index.js';
import { gpt4omini, o3Mini } from '@/server/ai/index';
import { db } from '@/server/db';
import { customField, customFieldValue, jobPost, organization } from '@/server/db/schema';
import { broadcastToUsers } from '@/websocket/server.svelte.js';

const schema = z.object({
	name: z.string().min(1).max(50),
	description: z.string().min(1).max(1000),
	type: z.enum(['boolean', 'date', 'number', 'text'])
});

export const POST = async ({ params, request, locals }) => {
	console.log('POST /api/job/[jobId]/customfield - Started', { jobId: params.jobId });
	const jobId = params.jobId;

	try {
		const body = await request.json();
		console.log('Request body received:', body);

		const { name, description, type } = schema.parse(body);
		console.log('Validated input:', { name, description, type });

		const job = await db.query.jobPost.findFirst({
			where: eq(jobPost.id, jobId),
			with: {
				candidates: {
					with: {
						linkedInProfile: true
					}
				}
			}
		});

		if (!job) {
			console.log('Job not found:', jobId);
			return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
		}

		// Ensure owner handle exists before querying organization
		if (!job.ownerOrganizationHandle) {
			console.error('Job is missing owner organization handle:', jobId);
			return json({ error: 'Job configuration error' }, { status: 500 });
		}

		const org = await db.query.organization.findFirst({
			where: eq(organization.handle, job.ownerOrganizationHandle), // Now safe
			with: {
				users: {
					columns: {
						id: true
					}
				}
			}
		});
		const people = org?.users.map((user) => user.id);

		if (!job) {
			console.log('Job not found:', jobId);
			return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
		}

		console.log(`Found job with ${job.candidates.length} candidates`);

		const [newCustomField] = await db
			.insert(customField)
			.values({
				id: uuidv4(),
				jobPostId: jobId,
				name,
				type,
				description
			})
			.returning();

		broadcastToUsers(locals.wss, people ?? [], {
			messageType: `${jobId}.customFieldCreated`, // Use job-specific channel
			data: {
				customField: newCustomField,
				jobId: jobId
			}
		});

		console.log('Created new custom field:', newCustomField);

		// Process candidates in batches of 10
		const batchSize = 10;
		for (let i = 0; i < job.candidates.length; i += batchSize) {
			const batch = job.candidates.slice(i, i + batchSize);

			// Process each candidate in the current batch
			for (const candidate of batch) {
				console.log(`Generating value for candidate: ${candidate.id}`);

				const prompt = `
<task>
  Generate a human-readable value for the custom field "${newCustomField.name}" (${newCustomField.description}) for this candidate based on their LinkedIn profile.
</task>

<job_description>
${generateJobPostEmbeddingInput(job)}
</job_description>

<candidate_profile>
${generateLinkedInProfileEmbeddingInput(candidate.linkedInProfile.data)}
</candidate_profile>

<output_requirements>
  Ensure the output is clear, concise, and easily understood by humans.
</output_requirements>
`;
				const value = await generateObject({
					model: o3Mini,
					schema: z.object({
						value:
							type === 'boolean'
								? z.boolean()
								: type === 'number'
									? z.number()
									: type === 'date'
										? z.string().datetime()
										: z.string()
					}),
					prompt: prompt
				});

				console.log(`Generated value for candidate ${candidate.id}:`, value.object.value);

				const [newValRecord] = await db
					.insert(customFieldValue)
					.values({
						id: uuidv4(),
						customFieldId: newCustomField.id,
						candidateId: candidate.id,
						value: String(value.object.value)
					})
					.returning();

				// Fetch the newly created value with its relation to send complete data
				const valueToBroadcast = await db.query.customFieldValue.findFirst({
					where: eq(customFieldValue.id, newValRecord.id),
					with: {
						customField: true // Ensure the nested customField is included
					}
				});

				if (valueToBroadcast) {
					broadcastToUsers(locals.wss, people ?? [], {
						messageType: `${jobId}.customFieldValueCreated`, // Use job-specific channel
						data: {
							// Send the fetched record directly
							customFieldValue: valueToBroadcast
						}
					});
				}

				console.log(`Saved custom field value for candidate ${candidate.id}`);
			}

			// Log batch completion
			console.log(
				`Completed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(job.candidates.length / batchSize)}`
			);
		}

		console.log('POST /api/job/[jobId]/customfield - Completed successfully');
		return json({ message: 'Custom field created', data: newCustomField }, { status: 200 });
	} catch (error) {
		console.error('Error in POST /api/job/[jobId]/customfield:', error);
		// Handle unknown error type
		const message = error instanceof Error ? error.message : 'An unknown error occurred';
		return json({ error: 'Failed to create custom field', details: message }, { status: 500 });
	}
};
export const DELETE = async ({ locals, params }) => {
	const jobId = params.jobId;
	const user = locals.user;

	const userHasAccess = await db.query.jobPost.findFirst({
		where: and(eq(jobPost.id, jobId), eq(jobPost.ownerOrganizationHandle, user.organizationHandle))
	});
	if (!userHasAccess) {
		return json({ error: 'You do not have access to this job' }, { status: 403 });
	}

	// Delete the custom field for this job
	await db.delete(customField).where(eq(customField.jobPostId, jobId));

	return json({ message: 'Custom fields deleted' }, { status: 200 });
};
