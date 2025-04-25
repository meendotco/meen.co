import { json } from '@sveltejs/kit';
import { and } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

import { db } from '@/server/db';
import { chat, chatMessage, jobPost, messageChunk, toolcall } from '@/server/db/schema';
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
		return json({ error: 'Job not found' }, { status: 404 });
	}
	await db.delete(jobPost).where(eq(jobPost.id, jobId));
	await db.delete(chat).where(and(eq(chat.jobPostId, jobId), eq(chat.title, 'Recruiter Agent')));
	await db.delete(chatMessage).where(eq(chatMessage.chatId, chatId));
	await db.delete(messageChunk).where(eq(messageChunk.chatMessageId, chatId));
	await db.delete(toolcall).where(eq(toolcall.chatMessageId, chatId));

	return json({ message: 'Job deleted' }, { status: 200 });
};
