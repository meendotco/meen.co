import { z } from 'zod';

import { getFullLinkedinProfile } from '@/server/linkedin';

const schema = z.object({
	linkedinHandle: z.string().min(1).max(100)
});

export const POST = async ({ request }) => {
	const body = await request.json();
	const { linkedinHandle } = schema.parse(body);

	if (!linkedinHandle) {
		return new Response('No linkedinHandle provided', { status: 400 });
	}

	const candidate = await getFullLinkedinProfile(linkedinHandle);
	return new Response(JSON.stringify(candidate), { status: 201 });
};
