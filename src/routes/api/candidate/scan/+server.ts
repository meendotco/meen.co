import { z } from 'zod';

import { runWorkFlow } from '@/server/ai/mastra/workflows';

const schema = z.object({
	query: z.string().min(1)
});

export const POST = async ({ request }) => {
	const body = await request.json();
	const { query } = schema.parse(body);
	const result = await runWorkFlow(query);

	return new Response(JSON.stringify(result), { status: 200 });
};
