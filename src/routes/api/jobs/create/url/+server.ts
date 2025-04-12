import type { RequestEvent } from '@sveltejs/kit';
import { generateObject } from 'ai';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { gpt4o, o3Mini } from '@/server/ai';
import { embedText } from '@/server/ai';
import { db } from '@/server/db';
import { jobPost } from '@/server/db/schema';
import { getJobDataFromURL } from '$lib/server/search/index';

export const POST = async ({ request, locals }: RequestEvent) => {
	try {
		const { url } = await request.json();
		console.log(url);
		const jobData = await getJobDataFromURL(url);

		console.log(jobData);
		const { object } = await generateObject({
			model: gpt4o,
			schema: z.object({
				title: z.string(),
				description: z.string(),
				department: z.string().optional(),
				location: z.string().optional(),
				type: z.string().optional(),
				priority: z.string().optional(),
				salary: z.string().optional(),
				remote_policy: z.string().optional(),
				responsibilities: z.string().optional(),
				requirements: z.string().optional(),
				benefits: z.string().optional(),
				tech_stack: z.string().optional()
			}),
			prompt: `Extract the following information from the job description: ${jobData}`
		});

		console.log(object);
		const user = locals.user;
		const stringForVector = `${object.title} ${object.description}`;
		const vector = await embedText(stringForVector);

		try {
			const post = await db.insert(jobPost).values({
				userId: user.id,
				ownerId: user.id,
				title: object.title,
				department: object.department,
				location: object.location,
				type: object.type,
				status: 'draft',
				priority: object.priority,
				salary: object.salary,
				vector: vector,
				description: object.description,
				responsibilities: object.responsibilities,
				requirements: object.requirements,
				benefits: object.benefits,
				tech_stack: object.tech_stack,
				remote_policy: object.remote_policy
			});

			console.log(post);
			return new Response(JSON.stringify(post), { status: 201 });
		} catch (dbError: any) {
			return new Response(JSON.stringify({ error: 'Database error', details: dbError.message }), {
				status: 500
			});
		}
	} catch (error: any) {
		return new Response(JSON.stringify({ error: 'Failed to create job', details: error.message }), {
			status: 500
		});
	}
};

export const PATCH = async ({ request, locals }: RequestEvent) => {
	const { id, title, description } = await request.json();
	const user = locals.user;
	const post = await db
		.update(jobPost)
		.set({ title, description })
		.where(and(eq(jobPost.id, id), eq(jobPost.userId, user.id)));
	return new Response(JSON.stringify(post), { status: 200 });
};
