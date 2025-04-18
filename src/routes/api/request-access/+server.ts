import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { db } from '@/server/db';
import { accessRequest } from '@/server/db/schema';

export const POST = async ({ request, locals }: RequestEvent) => {
	try {
		if (!locals.user) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
		}

		const { companyName, message } = await request.json();

		// Check if a request already exists for this user
		const existingRequest = await db
			.select()
			.from(accessRequest)
			.where(eq(accessRequest.userId, locals.user.id))
			.limit(1);

		let result;

		if (existingRequest.length > 0) {
			// Update existing request
			result = await db
				.update(accessRequest)
				.set({
					companyName,
					message,
					updatedAt: new Date()
				})
				.where(eq(accessRequest.userId, locals.user.id))
				.returning();
		} else {
			// Insert new request
			result = await db
				.insert(accessRequest)
				.values({
					userId: locals.user.id,
					companyName,
					message
				})
				.returning();
		}

		return new Response(JSON.stringify(result[0]), { status: 200 });
	} catch (error) {
		console.error('Error processing access request:', error);
		return new Response(JSON.stringify({ error: 'Failed to process request' }), { status: 500 });
	}
};
