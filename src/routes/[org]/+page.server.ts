import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

import { db } from '@/server/db';
import { jobPost } from '@/server/db/schema';

export const load: PageServerLoad = async ({ params }) => {
	const { org } = params;
	const jobs = await db.query.jobPost.findMany({
		where: eq(jobPost.ownerOrganizationHandle, org)
	});
	return { jobs };
};
