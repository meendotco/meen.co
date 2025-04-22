import { and, eq, ilike } from 'drizzle-orm';

import { db } from '@/server/db';
import { jobPost, organization } from '@/server/db/schema';

export async function load({ params }) {
	const { org, handle } = params;

	const postData = await db.query.jobPost.findFirst({
		where: and(ilike(jobPost.handle, handle), ilike(jobPost.ownerOrganizationHandle, org))
	});

	const currentOrgData = await db.query.organization.findFirst({
		where: eq(organization.handle, org)
	});

	return {
		post: postData,
		orgData: currentOrgData
	};
}
