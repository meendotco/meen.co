import { eq } from 'drizzle-orm';

import { jobPost } from '@/server/db/schema';
import { db } from '$lib/server/db';
export const load = async ({ locals }) => {
	const jobs = await db.query.jobPost.findMany({
		where: eq(jobPost.userId, locals.user.id),
		orderBy: (jobPost, { desc }) => [desc(jobPost.createdAt)]
	});
	return { jobs };
};
