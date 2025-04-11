import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { uuid } from 'drizzle-orm/pg-core';

import { findCandidates } from '@/server/ai/mastra/agents/linkedin';
import { db } from '@/server/db';
import { jobPost } from '@/server/db/schema';
import { broadcastToUsers, broadcastToUsersWithoutLocals } from '@/websocket/server.svelte.js';
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
	const agentStream = await agent.stream(
		`Find the Ideal candidates for this Job: ${job.description}`
	);
	for await (const chunk of agentStream.textStream) {
		console.log(chunk);
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
