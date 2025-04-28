import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { jobPost, linkedInProfile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { addCandidate } from '@/server/job';
import { z } from 'zod';
import { sendApplicationEmail } from '$lib/server/mail';
const linkedinUrlSchema = z.object({
	linkedinHandle: z.string().min(1).max(1000),
	matchScore: z.number().describe('The score of the candidate for the job from 0 to 100'),
	reasoning: z.string().describe('The reasoning for the match score')
});

export const POST: RequestHandler = async ({ request, params, locals }) => {
	try {
		const body = await request.json();
		const { linkedinHandle, matchScore, reasoning } = linkedinUrlSchema.parse(body);
		const jobId = params.jobId;

		if (!linkedinHandle || !jobId)
			return json({ error: 'LinkedIn URL and job ID are required' }, { status: 400 });

		const job = await db.query.jobPost.findFirst({
			where: eq(jobPost.id, jobId)
		});

		if (!job) return json({ error: 'Job not found' }, { status: 404 });

		const linkedinExists = await db.query.linkedInProfile.findFirst({
			where: eq(linkedInProfile.handle, linkedinHandle)
		});

		if (!linkedinExists) return json({ error: 'LinkedIn profile not found' }, { status: 404 });

		const candidate = await addCandidate(linkedinHandle, jobId, matchScore, reasoning, false, true);

		sendApplicationEmail(locals.user.email, candidate.linkedInProfile?.data?.full_name, job.ownerOrganizationHandle, job.title);

		return json({ success: true, candidate });
	} catch (error) {
		console.error('Error adding candidate:', error);
		return json({ error: 'Failed to add candidate' }, { status: 500 });
	}
};
