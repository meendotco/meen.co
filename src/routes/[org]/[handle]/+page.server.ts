import { and, eq, ilike } from 'drizzle-orm';

import { db } from '@/server/db';
import { jobPost, organization } from '@/server/db/schema';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const { org, handle } = params;

	const postData = await db.query.jobPost.findFirst({
		where: and(ilike(jobPost.handle, handle), ilike(jobPost.ownerOrganizationHandle, org))
	});

	if (!postData) throw error(404, 'Job post not found');

	const currentOrgData = await db.query.organization.findFirst({
		where: eq(organization.handle, org)
	});

	if (!currentOrgData) throw error(404, 'Organization not found');

	return {
		post: postData,
		orgData: currentOrgData
	};
}
