import { db } from '@/server/db';
import { jobPost } from '@/server/db/schema';

export const POST = async ({ request }) => {
	const { name, description, userId, ownerId, vector } = await request.json();

	const post = await db.insert(jobPost).values({
		name,
		description,
		userId,
		ownerId,
		vector
	});

	return new Response(JSON.stringify(post), { status: 201 });
};
