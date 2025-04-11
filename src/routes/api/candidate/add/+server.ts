import { getFullLinkedinProfile } from '@/server/linkedin';
export const POST = async ({ request }) => {
	const { linkedinUrl } = await request.json();

	if (!linkedinUrl) {
		return new Response('No linkedinUrl provided', { status: 400 });
	}

	const candidate = await getFullLinkedinProfile(linkedinUrl);
	return new Response(JSON.stringify(candidate), { status: 201 });
};
