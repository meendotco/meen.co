import { eq } from 'drizzle-orm';

import { db } from '@/server/db';
import { jobPost } from '@/server/db/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { org } = params;
	const jobs = await db.query.jobPost.findMany({
		where: eq(jobPost.ownerOrganizationHandle, org)
	});
	return { jobs };
};
