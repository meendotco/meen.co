import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { db } from '@/server/db';
import { customField, jobPost, organization } from '@/server/db/schema';
import { calculateCustomFieldValuesForBatch } from '@/server/job/customFields';
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

		// Prepare candidates data for batch processing
		const candidates = job.candidates.map((candidate) => ({
			id: candidate.id,
			profileData: candidate.linkedInProfile.data
		}));

		// Process all candidates in batches
		await calculateCustomFieldValuesForBatch(jobId, candidates, people ?? []);

		console.log('POST /api/job/[jobId]/customfield - Completed successfully');
		return json({ message: 'Custom field created', data: newCustomField }, { status: 200 });
	} catch (error) {
		console.error('Error in POST /api/job/[jobId]/customfield:', error);
		// Handle unknown error type
		const message = error instanceof Error ? error.message : 'An unknown error occurred';
		return json({ error: 'Failed to create custom field', details: message }, { status: 500 });
	}
};
