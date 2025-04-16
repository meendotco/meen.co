import { json } from '@sveltejs/kit';
import type { CoreMessage } from 'ai';
import { eq } from 'drizzle-orm';

import { findCandidatesInteractive } from '@/server/ai/mastra/agents/linkedin';
import { db } from '@/server/db';
import { chat, chatMessage, jobPost } from '@/server/db/schema';
import { broadcastToUsers } from '@/websocket/server.svelte.js';

export const POST = async ({ locals, params, request }) => {
	const jobId = params.jobId;
	const user = locals.user;

	const { message } = await request.json();

	const messageId = message.id;
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

	let chatId = job.chat?.id;
	if (!chatId) {
		const [newChat] = await db
			.insert(chat)
			.values({
				jobPostId: job.id,
				title: `Chat for ${job.title}`
			})
			.returning({ id: chat.id });

		chatId = newChat.id;
	}

	const formattedMessages = Array.isArray(job.chat?.messages)
		? job.chat.messages.map((message) => ({
				role: message.role,
				content: message.content ?? 'No content'
			}))
		: [];

	formattedMessages.push({
		role: 'user',
		content: message
	});
	await db.insert(chatMessage).values({
		chatId: chatId,
		role: 'user',
		content: message
	});
	const agent = await findCandidatesInteractive(job);

	const validMessages = formattedMessages.filter(
		(msg) => msg.role !== 'assistant' || (msg.content && msg.content.trim() !== '')
	);

	console.log('validMessages', validMessages);
	const agentStream = await agent.stream(validMessages as CoreMessage[]);

	let fullResponse = '';

	broadcastToUsers(locals.wss, [user.id], {
		messageType: 'messageStarted',
		data: {
			appPayload: { jobId: job.id, messageId: messageId }
		}
	});
	for await (const chunk of agentStream.fullStream) {
		broadcastToUsers(locals.wss, [user.id], {
			messageType: 'messageChunk',
			data: {
				chunk: chunk,
				appPayload: {
					jobId: job.id,
					messageId: messageId
				}
			}
		});

		if (chunk.type === 'text-delta') {
			fullResponse += chunk.textDelta;
		}
	}

	await db.insert(chatMessage).values({
		id: messageId,
		chatId: chatId,
		role: 'assistant',
		content: fullResponse
	});

	broadcastToUsers(locals.wss, [user.id], {
		messageType: 'messageComplete',
		data: {
			appPayload: { jobId: job.id, messageId: messageId }
		}
	});

	return json({ message: 'Job found', data: fullResponse });
};
