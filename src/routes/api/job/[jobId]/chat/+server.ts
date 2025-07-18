import { json } from '@sveltejs/kit';
import type { CoreMessage, ToolCallPart } from 'ai';
import { and, asc, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { findCandidatesInteractive } from '@/server/ai/mastra/agents/linkedin';
import { db } from '@/server/db';
import { chat, chatMessage, jobPost, messageChunk, toolcall } from '@/server/db/schema';
import { broadcastToUsers } from '@/websocket/server.svelte.js';

const schema = z.object({
	message: z.string().min(1).max(1000)
});

export const POST = async ({ locals, params, request }) => {
	const jobId = params.jobId;
	const user = locals.user;

	const body = await request.json();
	const { message } = schema.parse(body);

	const messageId = uuidv4();
	const job = await db.query.jobPost.findFirst({
		where: eq(jobPost.id, jobId),
		with: {
			candidates: {
				with: {
					linkedInProfile: true,
					customFieldValues: {
						with: {
							customField: true
						}
					}
				}
			},
			chat: {
				with: {
					messages: {
						with: {
							toolcalls: true
						},
						orderBy: asc(chatMessage.createdAt)
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
				id: chatId,
				jobPostId: job.id,
				title: `Chat for ${job.title}`
			})
			.returning({ id: chat.id });

		chatId = newChat.id;
	}

	const formattedMessages = Array.isArray(job.chat?.messages)
		? job.chat.messages.map((message) => ({
				id: message.id,
				role: message.role,
				content: message.content ?? 'No content'
			}))
		: [];

	formattedMessages.push({
		id: messageId,
		role: 'user',
		content: message
	});
	await db.insert(chatMessage).values({
		id: messageId,
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
	const assistantMessageId = uuidv4();

	broadcastToUsers(locals.wss, [user.id], {
		messageType: `${job.id}.messageStarted`,
		data: {
			appPayload: { jobId: job.id, messageId: assistantMessageId }
		}
	});
	const pendingToolCalls = new Map<string, ToolCallPart>();
	const toolCallsToCreate = new Map<string, typeof toolcall.$inferInsert>();
	const allMessageChunks = [];
	for await (const chunk of agentStream.fullStream) {
		broadcastToUsers(locals.wss, [user.id], {
			messageType: `${job.id}.messageChunk`,
			data: {
				chunk: chunk,
				appPayload: {
					jobId: job.id,
					messageId: assistantMessageId
				}
			}
		});

		allMessageChunks.push(chunk);
		if (chunk.type === 'text-delta') {
			console.log('chunk.textDelta', chunk.textDelta);
			fullResponse += chunk.textDelta;
		}

		if (chunk.type === 'tool-call') {
			pendingToolCalls.set(chunk.toolCallId, chunk);
		}
		if (chunk.type === 'tool-result') {
			const toolCall = pendingToolCalls.get(chunk.toolCallId);
			if (toolCall) {
				const toolCallToCreate = {
					id: chunk.toolCallId,
					chatMessageId: assistantMessageId,
					name: toolCall.toolName,
					args: toolCall.args,
					result: chunk.result
				};
				toolCallsToCreate.set(chunk.toolCallId, toolCallToCreate);
			}
		}

		if (chunk.type === 'error') {
			console.error(chunk.error);
		}
	}

	await db.insert(chatMessage).values({
		id: assistantMessageId,
		chatId: chatId,
		role: 'assistant',
		content: fullResponse
	});

	broadcastToUsers(locals.wss, [user.id], {
		messageType: `${job.id}.messageComplete`,
		data: {
			appPayload: { jobId: job.id, messageId: assistantMessageId }
		}
	});
	const promises = [
		toolCallsToCreate.size > 0
			? db.insert(toolcall).values(Array.from(toolCallsToCreate.values()))
			: Promise.resolve(),
		db.insert(messageChunk).values(
			allMessageChunks.map((chunk) => ({
				chatMessageId: assistantMessageId,
				chunk: chunk
			}))
		)
	];
	await Promise.allSettled(promises);

	return json({ message: 'Job found', data: fullResponse });
};
export const DELETE = async ({ locals, params }) => {
	const jobId = params.jobId;
	const user = locals.user;

	const userHasAccess = await db.query.jobPost.findFirst({
		where: and(eq(jobPost.id, jobId), eq(jobPost.ownerOrganizationHandle, user.organizationHandle))
	});
	if (!userHasAccess) {
		return json({ error: 'You do not have access to this job' }, { status: 403 });
	}

	const job = await db.query.jobPost.findFirst({
		where: eq(jobPost.id, jobId),
		with: {
			chat: true
		}
	});
	if (!job) {
		return json({ error: 'Job not found' }, { status: 404 });
	}
	const chatId = job.chat?.id;
	if (!chatId) {
		return json({ error: 'Chat not found' }, { status: 404 });
	}
	await db.delete(chat).where(and(eq(chat.jobPostId, jobId), eq(chat.title, 'Recruiter Agent')));
	await db.delete(chatMessage).where(eq(chatMessage.chatId, chatId));
	await db.delete(messageChunk).where(eq(messageChunk.chatMessageId, chatId));
	await db.delete(toolcall).where(eq(toolcall.chatMessageId, chatId));

	return json({ message: 'Chat deleted' }, { status: 200 });
};
