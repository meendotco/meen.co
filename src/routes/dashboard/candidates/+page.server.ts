import { db } from '$lib/server/db';

export async function load() {
	// Generate synthetic payment data
	const candidates = await db.query.linkedInProfile.findMany();

	return {
		candidates
	};
}
