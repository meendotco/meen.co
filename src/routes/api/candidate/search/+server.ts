import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { z } from 'zod';

import { embedText } from '@/server/ai';
import { db } from '@/server/db';
import { linkedInProfile } from '@/server/db/schema';

const schema = z.object({
	query: z.string().min(1).max(100)
});

export const POST = async ({ request }) => {
	const body = await request.json();
	const { query } = schema.parse(body);

	const embedding = await embedText(query);

	const similarity = sql<number>`1 - (${cosineDistance(linkedInProfile.vector, embedding)})`;

	const candidates = await db
		.select({
			id: linkedInProfile.id,
			data: linkedInProfile.data,
			handle: linkedInProfile.handle,
			similarity
		})
		.from(linkedInProfile)
		.where(gt(similarity, 0.0))
		.orderBy((t) => desc(t.similarity))
		.limit(5);

	return new Response(JSON.stringify(candidates), { status: 200 });
};
