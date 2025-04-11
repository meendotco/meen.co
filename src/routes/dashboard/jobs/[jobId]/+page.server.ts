import { and, eq } from 'drizzle-orm';

import { jobPost } from '@/server/db/schema';
import { db } from '$lib/server/db';
export const load = async ({ locals, params }) => {
	const job = await db.query.jobPost.findFirst({
		where: and(eq(jobPost.id, params.jobId), eq(jobPost.ownerId, locals.user.id))
	});
	return { job };
};
