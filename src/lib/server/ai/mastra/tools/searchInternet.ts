import { createTool } from '@mastra/core/tools';
import axios from 'axios';
import { z } from 'zod';

import { env } from '$env/dynamic/private';

const CRAWL4AI_BASE_URL = 'http://localhost:11235'; // Use correct port
const CRAWL4AI_API_TOKEN = env.CRAWL4AI_API_TOKEN || 'secret'; // Use env var or default

const searchInternetInputSchema = z.object({
	query: z.string().describe('The search query to use for Google.')
});

const searchInternetOutputSchema = z.object({
	markdown: z
		.string()
		.describe('The processed content of the search results page in Markdown format.')
		.optional(), // Make optional as crawl might fail
	url: z.string().url().describe('The Google search URL used.')
});

// Define an expected structure for the crawl result data
interface CrawlResultData {
	markdown?: string;
	// Add other potential fields if known
}

// Helper function for polling
async function pollTaskResult(taskId: string): Promise<CrawlResultData | null> {
	const maxAttempts = 10;
	const delay = 2000; // 2 seconds

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			const response = await axios.get(`${CRAWL4AI_BASE_URL}/task/${taskId}`, {
				headers: { Authorization: `Bearer ${CRAWL4AI_API_TOKEN}` }
			});

			if (response.data) {
				// console.log(`[pollTaskResult] Task ${taskId} status: ${response.data.status}`);
				if (response.data.status === 'completed') {
					return typeof response.data.result === 'object' && response.data.result !== null
						? response.data.result
						: {};
				} else if (response.data.status === 'failed') {
					// console.error(`[pollTaskResult] Task ${taskId} failed:`, response.data.error);
					throw new Error(`Crawl task ${taskId} failed: ${response.data.error || 'Unknown error'}`);
				} // Otherwise, status is likely 'pending' or 'processing', continue polling
			}
			// else {
			// console.warn(
			// 	`[pollTaskResult] Unexpected response structure for task ${taskId}:`,
			// 	response.data
			// );
			// }
		} catch (error: unknown) {
			if (axios.isAxiosError(error) && error.response?.status === 404) {
				// Task might not be immediately available, wait and retry
				// console.warn(`[pollTaskResult] Task ${taskId} not found (yet?), attempt ${attempt + 1}`);
			} else {
				// console.error(
				// 	`[pollTaskResult] Error polling task ${taskId}, attempt ${attempt + 1}:`,
				// 	error
				// );
				if (attempt === maxAttempts - 1) {
					if (error instanceof Error) throw error;
					else throw new Error(`Polling failed for task ${taskId} after ${maxAttempts} attempts.`);
				}
			}
		}
		await new Promise((resolve) => setTimeout(resolve, delay));
	}

	throw new Error(`Crawl task ${taskId} did not complete within the timeout period.`);
}

export function createSearchInternetTool() {
	return createTool({
		id: 'searchInternet',
		description:
			'Searches the internet using Google and returns the processed content of the search results page. Useful for finding general information, news, or resources online.',
		inputSchema: searchInternetInputSchema,
		outputSchema: searchInternetOutputSchema,
		execute: async ({ context }: { context: z.infer<typeof searchInternetInputSchema> }) => {
			const { query } = context;
			const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

			// console.log(`[searchInternet] Requesting crawl for URL: ${googleSearchUrl}`);

			try {
				// Step 1: Initiate crawl
				const crawlRequestPayload = {
					urls: googleSearchUrl
				};

				const crawlResponse = await axios.post(`${CRAWL4AI_BASE_URL}/crawl`, crawlRequestPayload, {
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${CRAWL4AI_API_TOKEN}`
					}
				});

				if (!crawlResponse.data || !crawlResponse.data.task_id) {
					// console.error(
					// 	'[searchInternet] Failed to get task_id from crawl request:',
					// 	crawlResponse.data
					// );
					throw new Error('Failed to initiate crawl: No task_id received.');
				}

				const taskId: string = crawlResponse.data.task_id;
				// console.log(`[searchInternet] Crawl task initiated with ID: ${taskId}`);

				// Step 2: Poll for result
				const resultData = await pollTaskResult(taskId);

				// console.log(`[searchInternet] Crawl task ${taskId} completed successfully.`);

				const output: z.infer<typeof searchInternetOutputSchema> = {
					markdown: resultData?.markdown || 'No markdown content extracted.',
					url: googleSearchUrl
				};
				searchInternetOutputSchema.parse(output); // Validate output
				return output;
			} catch (error: unknown) {
				// console.error(`[searchInternet] Error during crawl process for ${googleSearchUrl}:`, error);
				if (error instanceof Error) {
					throw new Error(`Failed searchInternet process: ${error.message}`);
				} else {
					throw new Error(
						`An unknown error occurred during the searchInternet process: ${String(error)}`
					);
				}
			}
		}
	});
}
