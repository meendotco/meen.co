import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { db } from '@/server/db';
import { jobPost, organization } from '@/server/db/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { org } = params;

	const currentOrgData = await db.query.organization.findFirst({
		where: eq(organization.handle, org)
	});

	if (!currentOrgData) {
		throw error(404, 'Organization not found');
	}

	const jobs = await db.query.jobPost.findMany({
		where: eq(jobPost.ownerOrganizationHandle, org)
	});

	return { jobs, orgData: currentOrgData };
};
