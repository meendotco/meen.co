import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { organization } from '$lib/server/db/schema';

export const PATCH = async ({ request, locals }: RequestEvent) => {
	try {
		if (!locals.user) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
		}

		const { handle, ...updateFields } = await request.json();

		try {
			if (!handle) {
				return new Response(JSON.stringify({ error: 'Organization handle is required' }), {
					status: 400
				});
			}

			const updatedOrg = await db
				.update(organization)
				.set(updateFields)
				.where(eq(organization.handle, handle));

			return new Response(JSON.stringify(updatedOrg), { status: 200 });
		} catch {
			return new Response(JSON.stringify({ error: 'Database error' }), {
				status: 500
			});
		}
	} catch {
		return new Response(JSON.stringify({ error: 'Failed to update organization' }), {
			status: 500
		});
	}
};
