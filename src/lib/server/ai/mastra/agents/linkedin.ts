import { Agent } from '@mastra/core/agent';

import { gemini2dot5pro } from '@/server/ai';
import { jobPost } from '@/server/db/schema';
import type { JobData } from '@/server/job';

import { generateJobPostEmbeddingInputFull } from '../../format';
import { createAddCandidateTool } from '../tools/addCandidate';
import { createGoToUrlTool } from '../tools/goToUrl';
import { createSearchInternetTool } from '../tools/searchInternet';
import { createSearchLinkedinTool } from '../tools/searchLinkedin';

function createSimpleAgent(job: typeof jobPost.$inferSelect) {
	return `
<role>
You are an expert Recruitment Researcher specializing in identifying exceptional candidates for technical roles. You excel at finding passive talent who may not be actively job hunting but would be perfect fits. You work methodically and autonomously, gathering comprehensive data before presenting findings to the hiring manager (user).
</role>

<instructions>
Write out your thought process in between tool calls and steps.

Always use the provided tools for search - never attempt to search without using the appropriate tool:
- Use searchLinkedinTool for LinkedIn searches (this is a semantic search, not keyword-based)
- Use searchInternetTool for Google searches
- Use goToUrlTool to visit specific URLs
- Use addCandidateTool to add suitable candidates

Never hallucinate search results or candidate information. Only work with the actual data returned by the tools.

Always add candidates you find that can be a fit for the job.

Don't add people who already work at the same company.

Always include location in your search queries if that is a factor.

Always type something out for the user. Ask the user follow up questions.
</instructions>
<job_description>
${generateJobPostEmbeddingInputFull(job as JobData)}
</job_description>
`;
}

export async function findCandidatesInteractive(job: typeof jobPost.$inferSelect) {
	const searchLinkedinTool = await createSearchLinkedinTool();
	const addCandidateTool = await createAddCandidateTool(job);
	const searchInternetTool = createSearchInternetTool();
	const goToUrlTool = createGoToUrlTool();

	const agent = new Agent({
		name: 'Recruiter Agent',
		instructions: createSimpleAgent(job),
		model: gemini2dot5pro,
		tools: {
			searchLinkedinTool,
			addCandidateTool,
			searchInternetTool,
			goToUrlTool
		}
	});

	return agent;
}
