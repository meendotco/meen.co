import { json } from '@sveltejs/kit';
import type { CoreMessage } from 'ai';
import { eq } from 'drizzle-orm';

import { generateJobPostEmbeddingInput } from '@/server/ai/format/index.js';
import { findCandidatesInteractive } from '@/server/ai/mastra/agents/linkedin';
import { db } from '@/server/db';
import { chatMessage, jobPost } from '@/server/db/schema';
import type { JobData } from '@/server/job/index.js';
import { broadcastToUsers } from '@/websocket/server.svelte.js';

export const POST = async ({ locals, params, request }) => {
	const jobId = params.jobId;
	const user = locals.user;

	const { message } = await request.json();

	const job = await db.query.jobPost.findFirst({
		where: eq(jobPost.id, jobId),
		with: {
			candidates: true,
			chat: {
				with: {
					messages: {
						with: {
							toolcalls: true
						}
					}
				}
			}
		}
	});

	if (!job) {
		return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
	}

	const onlyJob: JobData = {
		title: job.title,
		description: job.description,
		department: job.department || undefined,
		location: job.location || undefined,
		type: job.type || undefined,
		priority: job.priority || undefined,
		salary: job.salary ? String(job.salary) : undefined,
		remote_policy: job.remote_policy || undefined,
		responsibilities: job.responsibilities as string,
		requirements: job.requirements as string,
		benefits: job.benefits as string,
		tech_stack: job.tech_stack as string
	};

	// Ensure messages is an array of objects, not an array of arrays
	const formattedMessages = Array.isArray(job.chat?.messages)
		? job.chat.messages.map((message) => ({
				role: message.role,
				content: message.content ?? ''
			}))
		: [];

	if (formattedMessages.length === 0) {
		const firstMessage = `Here is the Job Post: ${generateJobPostEmbeddingInput(onlyJob)}. Start researching candidates and ask for feedback from the user.`;
		formattedMessages.push({
			role: 'user',
			content: firstMessage
		});
		await db.insert(chatMessage).values({
			chatId: job.chat.id,
			role: 'user',
			content: firstMessage
		});
	} else {
		formattedMessages.push({
			role: 'user',
			content: message
		});
		await db.insert(chatMessage).values({
			chatId: job.chat.id,
			role: 'user',
			content: message
		});
	}
	try {
		const agent = await findCandidatesInteractive(job);
		console.log(formattedMessages);
		const agentStream = await agent.stream(formattedMessages as CoreMessage[]);

		let fullResponse = '';
		for await (const chunk of agentStream.fullStream) {
			broadcastToUsers(locals.wss, [user.id], {
				messageType: 'messageChunk',
				data: {
					chatId: jobId,
					chunk: chunk
				}
			});

			if (chunk.type === 'text-delta') {
				fullResponse += chunk.textDelta;
			}
		}

		await db.insert(chatMessage).values({
			chatId: job.chat.id,
			role: 'assistant',
			content: fullResponse
		});

		return json({ message: 'Job found', data: fullResponse });
	} catch (error) {
		console.error('Error in chat processing:', error);
		return json({ error: 'Failed to process chat request' }, { status: 500 });
	}
};
