import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { jobPost } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { generateObject } from 'ai';
import { generateJobPostEmbeddingInput } from '$lib/server/ai/format';
import { gpt4o, embedText } from '$lib/server/ai';

const schema = z.object({
	description: z.string().optional(),
	status: z.enum(['Active', 'Closed']).optional(),
	type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']).optional(),
	department: z.string().optional(),
	location: z.string().optional(),
	salary: z.string().optional().nullable(),
	remote_policy: z.string().optional().nullable(),
	responsibilities: z.string().optional(),
	requirements: z.string().optional(),
	benefits: z.string().optional().nullable(),
	tech_stack: z.string().optional().nullable()
});

export const PATCH = async ({
	params,
	request
}: {
	params: { jobId: string };
	request: Request;
}) => {
	const jobId = params.jobId;
	const body = await request.json();
	const updateData = schema.parse(body);

	const job = await db.query.jobPost.findFirst({
		where: eq(jobPost.id, jobId)
	});

	if (!job) {
		return json({ error: 'Job not found' }, { status: 404 });
	}

	if (Object.keys(updateData).length === 1 && updateData.status) {
		await db.update(jobPost).set({ status: updateData.status }).where(eq(jobPost.id, jobId));
		return json({ message: 'Job status updated successfully' }, { status: 200 });
	}

	await db.update(jobPost).set(updateData).where(eq(jobPost.id, jobId));

	// Update vector asynchronously
	(async () => {
		try {
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
				prompt: `Extract the following information from the job description: ${JSON.stringify(job)}. Please don't include any company information in the job description.`
			});

			const stringForVector = generateJobPostEmbeddingInput(object);
			const vector = await embedText(stringForVector);

			await db.update(jobPost).set({ vector }).where(eq(jobPost.id, jobId));
		} catch (error) {
			console.error('Error during vectorization:', error);
		}
	})();

	return json({ message: 'Job updated successfully' }, { status: 200 });
};
