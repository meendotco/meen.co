import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { linkedInProfile } from '@/server/db/schema';
import { db } from '$lib/server/db';

import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const candidate = await db.query.linkedInProfile.findFirst({
		where: eq(linkedInProfile.id, params.candidateId)
	});

	if (!candidate) {
		throw error(404, 'Candidate not found');
	}

	return { candidate };
}) satisfies PageServerLoad;
