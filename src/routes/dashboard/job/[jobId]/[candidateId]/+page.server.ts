import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

import { candidates, jobPost } from '@/server/db/schema';
import { db } from '$lib/server/db';

import type { PageServerLoad } from './$types';

export const load = (async ({ locals, params }) => {
	const job = await db.query.jobPost.findFirst({
		where: and(
			eq(jobPost.id, params.jobId),
			eq(jobPost.ownerOrganizationHandle, locals.user.organizationHandle)
		),
		with: {
			candidates: {
				with: {
					linkedInProfile: true
				}
			}
		}
	});

	if (!job) {
		throw error(404, 'Job not found');
	}

	// Fetch the specific candidate using candidateId
	const candidate = await db.query.candidates.findFirst({
		where: and(eq(candidates.id, params.candidateId), eq(candidates.jobPostId, params.jobId)),
		with: {
			linkedInProfile: true
		}
	});

	if (!candidate) {
		throw error(404, 'Candidate not found');
	}

	return { job, candidate };
}) satisfies PageServerLoad;
