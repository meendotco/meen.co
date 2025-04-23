import { json } from '@sveltejs/kit';
import { generateObject } from 'ai';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { generateLinkedInProfileEmbeddingInput } from '@/server/ai/format/index.js';
import { gpt4omini } from '@/server/ai/index';
import { db } from '@/server/db';
import { customField, customFieldValue, jobPost } from '@/server/db/schema';

const schema = z.object({
	name: z.string().min(1).max(50),
	description: z.string().min(1).max(1000),
	type: z.enum(['boolean', 'date', 'number', 'text'])
});

export const POST = async ({ params, request }) => {
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

		console.log('Created new custom field:', newCustomField);

		for (const candidate of job.candidates) {
			console.log(`Generating value for candidate: ${candidate.id}`);

			const value = await generateObject({
				model: gpt4omini,
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
				prompt: `Generate a human-readable value for the custom field "${newCustomField.name}" (${newCustomField.description}) for this candidate based on their LinkedIn profile: \n\n${generateLinkedInProfileEmbeddingInput(candidate.linkedInProfile.data)}\n\nEnsure the output is clear, concise, and easily understood by humans.`
			});

			console.log(`Generated value for candidate ${candidate.id}:`, value.object.value);

			await db.insert(customFieldValue).values({
				id: uuidv4(),
				customFieldId: newCustomField.id,
				candidateId: candidate.id,
				value: String(value.object.value)
			});

			console.log(`Saved custom field value for candidate ${candidate.id}`);
		}

		console.log('POST /api/job/[jobId]/customfield - Completed successfully');
		return json({ message: 'Custom field created', data: newCustomField }, { status: 200 });
	} catch (error) {
		console.error('Error in POST /api/job/[jobId]/customfield:', error);
		return json(
			{ error: 'Failed to create custom field', details: error.message },
			{ status: 500 }
		);
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
