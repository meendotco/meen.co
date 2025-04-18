import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const userId = locals.user?.id;

		if (!userId) {
			throw error(401, 'Unauthorized');
		}

		const preferences = await request.json();

		await db.update(users).set({ preferences }).where(eq(users.id, userId));

		return json({
			success: true,
			message: 'Preferences updated successfully'
		});
	} catch (err) {
		console.error('Failed to update preferences:', err);
		throw error(500, 'Failed to update preferences');
	}
};
