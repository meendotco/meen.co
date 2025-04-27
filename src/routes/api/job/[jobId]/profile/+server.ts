import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { jobPost, linkedInProfile, candidates } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { generateObject } from 'ai';
import {
	generateJobPostEmbeddingInput,
	generateLinkedInProfileEmbeddingInput
} from '@/server/ai/format';
import { gemini2dot5pro } from '@/server/ai';
import { getFullLinkedinProfile } from '@/server/linkedin';

const profileSchema = z.object({
	linkedinUrl: z.string().url()
});

export const POST: RequestHandler = async ({ request, params }) => {
	try {
		const body = await request.json();
		const { linkedinUrl } = profileSchema.parse(body);
		const jobId = params.jobId;

		if (!linkedinUrl || !jobId) {
			return json({ error: 'LinkedIn URL and job ID are required' }, { status: 400 });
		}

		const linkedinHandle = linkedinUrl.split('/in/')[1].replace('/', '');

		const job = await db.query.jobPost.findFirst({
			where: eq(jobPost.id, jobId)
		});

		if (!job) {
			return json({ error: 'Job not found' }, { status: 404 });
		}

		const linkedinExists = await db.query.linkedInProfile.findFirst({
			where: eq(linkedInProfile.handle, linkedinHandle)
		});

		let linkedinProfile: Record<string, any>;

		if (linkedinExists) {
			linkedinProfile = linkedinExists.data;
			const candidateExists = await db.query.candidates.findFirst({
				where: and(
					eq(candidates.linkedInProfileId, linkedinExists.id),
					eq(candidates.jobPostId, jobId),
					eq(candidates.applied, true)
				)
			});

			if (candidateExists) return json({ error: 'Already applied' }, { status: 400 });
		} else {
			linkedinProfile = await getFullLinkedinProfile(linkedinHandle);
		}

		const llmAssessment = await generateObject({
			model: gemini2dot5pro,
			schema: z.object({
				matchScore: z.number().describe('The score of the candidate for the job from 0 to 100'),
				reasoning: z.string().describe('The reasoning for the match score')
			}),
			prompt: `
<instructions>
You are a recruiter for the job ${job.title}.
You are given a LinkedIn profile URL and a job description.
You need to assess the candidate's suitability for the job.
</instructions>
<job_post>
${generateJobPostEmbeddingInput(job)}
</job_post>

<linkedin_profile>
${generateLinkedInProfileEmbeddingInput(linkedinProfile)}
</linkedin_profile>
`
		});

		return json({
			success: true,
			assessment: {
				matchScore: llmAssessment.object.matchScore,
				reasoning: llmAssessment.object.reasoning,
				handle: linkedinHandle,
				linkedinProfile: linkedinProfile
			}
		});
	} catch (error) {
		console.error('Error assessing candidate:', error);
		if (error instanceof z.ZodError) {
			return json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
		}
		return json({ error: 'Failed to assess candidate' }, { status: 500 });
	}
};
