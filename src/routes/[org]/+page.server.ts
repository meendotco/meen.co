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

	const jobsByDepartment = jobs.reduce(
		(acc, job) => {
			const department = job.department || 'Other';
			if (!acc[department]) {
				acc[department] = [];
			}
			acc[department].push(job);
			return acc;
		},
		{} as Record<string, typeof jobs>
	);

	return { jobs: jobsByDepartment, orgData: currentOrgData };
};
