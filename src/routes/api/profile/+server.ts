import { getFullLinkedinProfile } from '$lib/server/linkedin';
// import { getLinkedinProfile } from '$lib/server/linkedin';

export async function GET({ locals }) {
	const user = locals.user;

	if (!user) {
		return new Response('Unauthorized', { status: 401 });
	}

	//const profile = await getLinkedinProfile(locals.user.id)
	const profile = await getFullLinkedinProfile();
	return new Response(JSON.stringify(profile), { status: 200 });
}
