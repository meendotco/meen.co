import { z } from 'zod';

import { getFullLinkedinProfile } from '@/server/linkedin';

const schema = z.object({
	linkedinUrl: z.string().url()
});

export const POST = async ({ request }) => {
	const body = await request.json();
	const { linkedinUrl } = schema.parse(body);

	if (!linkedinUrl) {
		return new Response('No linkedinUrl provided', { status: 400 });
	}

	const candidate = await getFullLinkedinProfile(linkedinUrl.split('/in/')[1].replace('/', ''));
	return new Response(JSON.stringify(candidate), { status: 201 });
};
