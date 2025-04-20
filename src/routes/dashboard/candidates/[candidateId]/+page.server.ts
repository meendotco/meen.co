import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

import { linkedInProfile } from '@/server/db/schema';
import { db } from '$lib/server/db';

export const load = (async ({ locals, params }) => {
	const candidate = await db.query.linkedInProfile.findFirst({
		where: eq(linkedInProfile.handle, params.candidateId)
	});

	if (!candidate) {
		throw error(404, 'Candidate not found');
	}

	return { candidate };
}) satisfies PageServerLoad;
