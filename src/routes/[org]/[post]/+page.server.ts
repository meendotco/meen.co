import { and, eq } from 'drizzle-orm';

import { db } from '@/server/db';
import { jobPost } from '@/server/db/schema';

export async function load({ params }) {
	const { org, post } = params;
	const postData = await db.query.jobPost.findFirst({
		where: and(eq(jobPost.handle, post), eq(jobPost.ownerOrganizationHandle, org))
	});

	return {
		post: postData
	};
}
