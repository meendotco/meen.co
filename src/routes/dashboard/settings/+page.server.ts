import { eq } from 'drizzle-orm';

import { accounts, organization } from '@/server/db/schema';
import { db } from '$lib/server/db';

export const load = async ({ locals }) => {
	const userOrganization = db.query.organization.findFirst({
		where: eq(organization.handle, locals.user.organizationHandle),
		with: {
			users: true
		}
	});

	const userAccounts = db.query.accounts.findMany({
		where: eq(accounts.userId, locals.user.id)
	});

	return { userOrganization, userAccounts };
};
