import { and, eq } from 'drizzle-orm';

import { jobPost } from '@/server/db/schema';
import { db } from '$lib/server/db';

export const load = async ({ locals }) => {
	return {
		streamed: {
			jobs: db.query.jobPost.findMany({
				where: and(
					eq(jobPost.ownerOrganizationHandle, locals.user.organizationHandle),
					eq(jobPost.isDeleted, false)
				),
				limit: 10,
				orderBy: (jobPost, { desc }) => [desc(jobPost.createdAt)]
			})
		}
	};
};
