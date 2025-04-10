import { and, eq } from 'drizzle-orm';

import { embedText } from '@/server/ai';
import { db } from '@/server/db';
import { jobPost } from '@/server/db/schema';
export const POST = async ({ request, locals }) => {
	const { name, description } = await request.json();

	const user = locals.user;
	const stringForVector = `${name} ${description}`; // Very simple for now
	const vector = await embedText(stringForVector);
	const post = await db.insert(jobPost).values({
		name,
		description,
		userId: user.id,
		ownerId: user.id,
		vector: vector
	});

	return new Response(JSON.stringify(post), { status: 201 });
};

export const PATCH = async ({ request, locals }) => {
	const { id, name, description } = await request.json();
	const user = locals.user;
	const post = await db
		.update(jobPost)
		.set({ name, description })
		.where(and(eq(jobPost.id, id), eq(jobPost.userId, user.id)));
	return new Response(JSON.stringify(post), { status: 200 });
};
