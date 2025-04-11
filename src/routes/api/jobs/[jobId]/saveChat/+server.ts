import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { db } from '@/server/db';
import { jobPost } from '@/server/db/schema';

import { saveAssessmentHistory } from '../../../../../routes/dashboard/jobs/[jobId]/+page.server';

export const POST = async ({ locals, params, request }) => {
	const jobId = params.jobId;
	const user = locals.user;

	// Check if job exists and belongs to the user
	const job = await db.query.jobPost.findFirst({
		where: eq(jobPost.id, jobId)
	});

	if (!job) {
		return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
	}

	if (job.ownerId !== user.id) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
	}

	const { chatHistory } = await request.json();

	// Save the most recent assessment to our history
	if (chatHistory.length > 0) {
		const latestChat = chatHistory[chatHistory.length - 1];
		saveAssessmentHistory(jobId, latestChat.content);
	}

	return json({
		success: true,
		message: 'Chat history saved',
		count: chatHistory.length
	});
};
