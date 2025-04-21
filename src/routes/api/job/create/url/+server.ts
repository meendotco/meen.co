import type { RequestEvent } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '$lib/server/db';
import { jobPost } from '$lib/server/db/schema';
import { insertJob } from '$lib/server/job';
import { getJobDataFromURL } from '$lib/server/search/index';

const schema = z.object({
	url: z.string().url()
});

export const POST = async ({ request, locals }: RequestEvent) => {
	try {
		const body = await request.json();
		const { url } = schema.parse(body);

		const jobData = await getJobDataFromURL(url);
		if (!jobData) {
			return new Response(
				JSON.stringify({ error: 'Failed to create job', details: 'No job data found' }),
				{
					status: 400
				}
			);
		}
		console.log(locals.user.organizationHandle);

		const job = await insertJob(jobData, locals.user.organizationHandle);

		return new Response(JSON.stringify(job), { status: 201 });
	} catch (error) {
		console.error('Error creating job:', error);
		return new Response(JSON.stringify({ error: 'Failed to create job', details: error }), {
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
