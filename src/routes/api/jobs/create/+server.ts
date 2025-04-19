import type { RequestEvent } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

import { db } from '@/server/db';
import { jobPost } from '@/server/db/schema';
import { insertJob } from '@/server/job';
import type { Job } from '@/types/job';

export const POST = async ({ request, locals }: RequestEvent) => {
	try {
		const jobData: Job = await request.json();
		console.log(jobData);
		if (!locals.user) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
		}

		const jobDataString = JSON.stringify(jobData);
		try {
			const job = await insertJob(jobDataString, locals.user.organizationHandle);

			return new Response(JSON.stringify(job), { status: 201 });
		} catch (dbError: any) {
			console.error('Database error:', dbError);
			return new Response(JSON.stringify({ error: 'Database error', details: dbError.message }), {
				status: 500
			});
		}
	} catch (error: any) {
		console.error('Error creating job:', error);
		return new Response(JSON.stringify({ error: 'Failed to create job', details: error.message }), {
			status: 500
		});
	}
};

export const PATCH = async ({ request, locals }: RequestEvent) => {
	const { id, title, description } = await request.json();
	const user = locals.user;
	const post = await db
		.update(jobPost)
		.set({ title, description })
		.where(and(eq(jobPost.id, id), eq(jobPost.ownerOrganizationHandle, user.organizationHandle)));
	return new Response(JSON.stringify(post), { status: 200 });
};
