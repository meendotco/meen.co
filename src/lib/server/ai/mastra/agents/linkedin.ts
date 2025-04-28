import { Agent } from '@mastra/core/agent';

import { gemini2dot5pro } from '@/server/ai';
import { jobPost } from '@/server/db/schema';
import type { JobData } from '@/server/job';
import type { CandidateForTable } from '../../format';
import { generateCandidateTable, generateJobPostEmbeddingInputFull } from '../../format';
import { createAddCandidateTool } from '../tools/addCandidate';
import { createGoToUrlTool } from '../tools/goToUrl';
import { createSearchInternetTool } from '../tools/searchInternet';
import { createSearchLinkedinTool } from '../tools/searchLinkedin';

// Define the combined type
type JobWithCandidates = typeof jobPost.$inferSelect & {
	candidates: CandidateForTable[];
};

function createSimpleAgent(job: JobWithCandidates) {
	return `
<role>
You are an expert Recruitment Researcher specializing in identifying exceptional candidates for technical roles. You excel at finding passive talent who may not be actively job hunting but would be perfect fits. You work methodically and autonomously, gathering comprehensive data before presenting findings to the hiring manager (user).
</role>

<instructions>
Write out your thought process between tool calls and steps, but keep explanations clear and moderate in length.

Always use the provided tools for search - never attempt to search without using the appropriate tool:
- Use searchLinkedinTool for LinkedIn searches (this is a semantic search, not keyword-based)
- Use searchInternetTool for Google searches
- Use goToUrlTool to visit specific URLs
- Use addCandidateTool to add suitable candidates

Never hallucinate search results or candidate information. Only work with the actual data returned by the tools.

Provide informative but concise responses. Avoid excessive detail while ensuring your reasoning is clear.
</instructions>

<rules>
- Find candidates who are a good fit for the role based on skills and experience, not just job title
- Look for candidates with transferable skills from adjacent fields or different titles
- Focus on capabilities that match the role requirements rather than exact title matches
- Don't add people who already work at the same company
- Always include location in your search queries if that is a factor
- Add all suitable candidates you find using the addCandidateTool
</rules>

<quality_assurance>
NEVER HALLUCINATE A SEARCH OR RESULT. ALWAYS USE THE PROVIDED TOOLS.

- Keep responses reasonably brief while including necessary context and explanations.
- Always add candidates you find that can be a fit for the job.
- Never end with a simple search query. Always investigate the results of the search.
- Focus on finding people whose capabilities match the role requirements, even if they come from adjacent fields.
</quality_assurance>

<assessment>
- When assessing candidates, provide a clear but concise explanation of what makes them a good fit for the job.
</assessment>

<job_description>
${generateJobPostEmbeddingInputFull(job as JobData)}
</job_description>

<candidate_table>
${generateCandidateTable(job.candidates)}
</candidate_table>
`;
}

export async function findCandidatesInteractive(job: JobWithCandidates) {
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
