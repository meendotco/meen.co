import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/server/db';
import { jobPost, candidates } from '@/server/db/schema';

const schema = z.object({
	view: z.enum(['list', 'table'])
});

export const POST = async ({ locals, params, request }) => {
	const jobId = params.jobId;
	const user = locals.user;

	const body = await request.json();
	const { view } = schema.parse(body);

	const job = await db.query.jobPost.findFirst({
		where: eq(jobPost.id, jobId)
	});

	if (!job) {
		return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
	}

	if (user.organizationHandle !== job.ownerOrganizationHandle) {
		return new Response(JSON.stringify({ error: 'You do not have access to this job' }), {
			status: 403
		});
	}

	await db.update(jobPost).set({ view }).where(eq(jobPost.id, jobId));

	return json({ message: 'View updated' });
};
