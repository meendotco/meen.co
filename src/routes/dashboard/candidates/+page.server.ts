import { db } from '$lib/server/db';

export async function load() {
	const candidates = await db.query.linkedInProfile.findMany({
		limit: 10,
		orderBy: (linkedInProfile, { desc }) => [desc(linkedInProfile.createdAt)]
	});

	return {
		candidates
	};
}
