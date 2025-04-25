import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

import { candidates, jobPost, linkedInProfile } from '@/server/db/schema';
import { db } from '$lib/server/db';

import type { PageServerLoad } from './$types';

export const load = (async ({ locals, params }) => {
	const [job, linkedinProfile] = await Promise.all([
		db.query.jobPost.findFirst({
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
		}),
		db.query.linkedInProfile.findFirst({
			where: eq(linkedInProfile.handle, params.candidateId)
		})
	]);

	if (!job) {
		throw error(404, 'Job not found');
	}

	if (!linkedinProfile) {
		throw error(404, 'LinkedIn profile not found');
	}

	const candidate = await db.query.candidates.findFirst({
		where: and(
			eq(candidates.linkedInProfileId, linkedinProfile.id),
			eq(candidates.jobPostId, params.jobId)
		),
		with: {
			linkedInProfile: true
		}
	});

	if (!candidate) {
		throw error(404, 'Candidate not found');
	}

	return { job, candidate };
}) satisfies PageServerLoad;
