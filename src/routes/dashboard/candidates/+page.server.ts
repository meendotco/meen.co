import { db } from '$lib/server/db';

export async function load() {
	return {
		candidates: db.query.linkedInProfile.findMany()
	};
}
