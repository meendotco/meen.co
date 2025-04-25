import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { jobPost, linkedInProfile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
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

		const job = await db.query.jobPost.findFirst({
			where: eq(jobPost.id, jobId)
		});

		if (!job) {
			return json({ error: 'Job not found' }, { status: 404 });
		}

		const linkedinExists = await db.query.linkedInProfile.findFirst({
			where: eq(linkedInProfile.handle, linkedinUrl.split('/in/')[1].replace('/', ''))
		});

		const linkedinProfile = linkedinExists
			? linkedinExists.data
			: await getFullLinkedinProfile(linkedinUrl.split('/in/')[1].replace('/', ''));

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
				handle: linkedinUrl.split('/in/')[1].replace('/', ''),
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
