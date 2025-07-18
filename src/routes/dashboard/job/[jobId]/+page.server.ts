import { error } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';

import { chat, chatMessage, jobPost, messageChunk } from '@/server/db/schema';
import { db } from '$lib/server/db';
export const ssr = false;
export const load = async ({ locals, params }) => {
	const job = await db.query.jobPost.findFirst({
		where: and(
			eq(jobPost.id, params.jobId),
			eq(jobPost.ownerOrganizationHandle, locals.user.organizationHandle)
		),
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
							toolcalls: true,
							messageChunks: {
								orderBy: asc(messageChunk.createdAt)
							}
						},
						orderBy: asc(chatMessage.createdAt)
					}
				}
			},
			customFields: true
		}
	});

	if (!job) {
		throw error(404, 'Job not found');
	}
	if (!job?.chat) {
		const newChat = await db
			.insert(chat)
			.values({
				jobPostId: job.id,
				title: 'Recruiter Agent'
			})
			.returning();
		job.chat = {
			...newChat[0],
			messages: []
		};
	}
	return { job };
};
