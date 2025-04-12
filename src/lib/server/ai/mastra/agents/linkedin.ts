import { Agent } from '@mastra/core/agent';

import { claude37Sonnet, gpt4o, gpt4omini, o3Mini } from '@/server/ai';
import { jobPost } from '@/server/db/schema';

import { createAddCandidateTool } from '../tools/addCandidate';
import { createFetchLinkedinProfileTool } from '../tools/fetchLinkedinProfile';
import { createGoToUrlTool } from '../tools/goToUrl';
import { createSearchInternetTool } from '../tools/searchInternet';
import { createSearchLinkedinTool } from '../tools/searchLinkedin';
export async function findCandidates(job: typeof jobPost.$inferSelect) {
	const searchLinkedinTool = await createSearchLinkedinTool();
	const addCandidateTool = await createAddCandidateTool(job);
	const fetchLinkedinProfileTool = await createFetchLinkedinProfileTool();
	const searchInternetTool = createSearchInternetTool();
	const goToUrlTool = createGoToUrlTool();
	return new Agent({
		name: 'LinkedIn Agent',
		instructions: `
<role>
You are an expert LinkedIn recruiter tasked with finding the most suitable candidates for a given job description. You have access to LinkedIn search, profile fetching, general internet search, and URL visiting tools.
</role>

<instructions>
	Perform many internet searches to find new candidates. Then fetch their LinkedIn profile and add them to the database.
	You can also use the \`searchLinkedinTool\` to find candidates on LinkedIn.
	You can also use the \`goToUrlTool\` to visit websites and extract information from them.
	You can also use the \`addCandidateTool\` to add candidates to the database.

	Please try to assess as many candidates as possible.
</instructions>

<find_new_candidates>
	Please try to always add new profiles to the database from linkedin. This will improve search results for future jobs.
</find_new_candidates>

<output>
	Strictly use the available tools (\`searchInternetTool\`, \`fetchLinkedinProfileTool\`, \`goToUrlTool\`, \`addCandidateTool\`, \`searchLinkedinTool\`) to perform actions. Output detailed step-by-step reasoning, decisions, and analysis within the 'thought' property of your response. The final output should be the summary requested in step 11.
</output>

<job>
	Name: ${job.name}
	Description: ${job.description}
</job>
`,
		model: gpt4omini,
		tools: {
			searchLinkedinTool,
			addCandidateTool,
			fetchLinkedinProfileTool,
			searchInternetTool,
			goToUrlTool
		}
	});
}
