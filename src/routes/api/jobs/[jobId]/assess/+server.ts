import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { uuid } from 'drizzle-orm/pg-core';

import { findCandidates } from '@/server/ai/mastra/agents/linkedin';
import { db } from '@/server/db';
import { jobPost } from '@/server/db/schema';
import { broadcastToUsers } from '@/websocket/server.svelte.js';

export const POST = async ({ locals, params }) => {
	let fullResponse = '';
	const jobId = params.jobId;
	const user = locals.user;

	const job = await db.query.jobPost.findFirst({
		where: eq(jobPost.id, jobId),
		with: {
			candidates: true
		}
	});

	if (!job) {
		return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
	}

	const agent = await findCandidates(job);
	const agentStream = await agent.stream(`Hello!
		
		Please find the ideal candidates for this job: ${job.description}. Please try to find at least 3 candidates.
		
		Only tell me your thought process and don't ask anything. be fully autonomous until you have found the candidates.
		
		`);
	for await (const chunk of agentStream.textStream) {
		fullResponse += chunk;
		broadcastToUsers(locals.wss, [user.id], {
			messageType: 'chunk',
			data: {
				chatId: jobId,
				messageId: uuid(),
				chunk: chunk
			}
		});
	}

	return json({ message: 'Job found', data: fullResponse });
};
