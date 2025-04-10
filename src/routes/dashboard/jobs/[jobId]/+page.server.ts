import { eq } from 'drizzle-orm';

import { jobPost } from '@/server/db/schema';
import { db } from '$lib/server/db';
export const load = async ({ locals, params }) => {
	const job = await db.query.jobPost.findFirst({
		where: eq(jobPost.id, params.jobId)
	});
	return { job };
};
