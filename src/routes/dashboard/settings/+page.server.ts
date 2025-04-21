import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { organization } from '@/server/db/schema';
import { db } from '$lib/server/db';

import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	const userOrganization = await db.query.organization.findFirst({
		where: eq(organization.handle, locals.user.organizationHandle),
		with: {
			users: true
		}
	});

	if (!userOrganization) {
		throw error(404, 'Organization not found');
	}

	return { userOrganization };
}) satisfies PageServerLoad;
