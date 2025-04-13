import { and, eq } from 'drizzle-orm';

import { jobPost } from '@/server/db/schema';
import { db } from '$lib/server/db';
export const load = async ({ locals, params, depends }) => {
	const job = await db.query.jobPost.findFirst({
		where: and(eq(jobPost.id, params.jobId), eq(jobPost.ownerId, locals.user.id)),
		with: {
			candidates: {
				with: {
					linkedInProfile: true
				},
				columns: {
					id: true,
					jobPostId: true,
					linkedInProfileId: true,
					createdAt: true,
					updatedAt: true,
					reasoning: true,
					matchScore: true
				}
			}
		}
	});
	return { job };
};
