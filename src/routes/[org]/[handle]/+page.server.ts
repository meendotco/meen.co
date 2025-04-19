import { and, ilike } from 'drizzle-orm';

import { db } from '@/server/db';
import { jobPost } from '@/server/db/schema';

export async function load({ params, locals }) {
	const { org, handle } = params;

	const postData = await db.query.jobPost.findFirst({
		where: and(ilike(jobPost.handle, handle), ilike(jobPost.ownerOrganizationHandle, org))
	});

	return {
		post: postData
	};
}
