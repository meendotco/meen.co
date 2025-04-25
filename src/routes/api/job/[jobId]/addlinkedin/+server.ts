import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { jobPost } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { addCandidate } from '@/server/job';
import { z } from 'zod';
import { generateObject } from 'ai';
import {
	generateJobPostEmbeddingInput,
	generateLinkedInProfileEmbeddingInput
} from '@/server/ai/format';
import { gemini2dot5pro } from '@/server/ai';
import { openai } from '@ai-sdk/openai';
import { getFullLinkedinProfile } from '@/server/linkedin';
const linkedinUrlSchema = z.string().url();
export const POST: RequestHandler = async ({ request, params }) => {
	try {
		const { linkedinUrl } = await request.json();
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

		const linkedinProfile = await getFullLinkedinProfile(
			linkedinUrl.split('/in/')[1].replace('/', '')
		);
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
		const candidate = await addCandidate(
			linkedinUrl.split('/in/')[1].replace('/', ''),
			jobId,
			llmAssessment.object.matchScore,
			llmAssessment.object.reasoning
		);

		return json({ success: true, candidate });
	} catch (error) {
		console.error('Error adding candidate:', error);
		return json({ error: 'Failed to add candidate' }, { status: 500 });
	}
};
