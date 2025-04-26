import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { linkedInProfile } from '$lib/server/db/schema';
import { count } from 'drizzle-orm';

export const load = (async ({ url }) => {
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
	const offset = (page - 1) * pageSize;

	const [candidates, totalResult] = await Promise.all([
		db.query.linkedInProfile.findMany({
			limit: pageSize,
			offset,
			orderBy: (profile, { desc }) => [desc(profile.createdAt)]
		}),
		db.select({ value: count() }).from(linkedInProfile)
	]);

	const total = totalResult[0].value;

	return {
		candidates,
		pagination: {
			page,
			pageSize,
			total,
			totalPages: Math.ceil(total / pageSize)
		}
	};
}) satisfies PageServerLoad;
