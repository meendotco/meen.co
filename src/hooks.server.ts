import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { eq } from 'drizzle-orm';

import { paraglideMiddleware } from '$lib/paraglide/server';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';

import { handle as AuthHandle } from './auth';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const authorize: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith('/api')) {
		return resolve(event);
	}
	const auth = await event.locals.auth();
	if (!auth || !auth.user || !auth.user.email) {
		return new Response('Unauthorized', { status: 401 });
	}

	const user = await db.query.users.findFirst({
		where: eq(users.email, auth.user.email)
	});
	if (!user) {
		return new Response('Unauthorized', { status: 401 });
	}
	event.locals.user = user;
	return resolve(event);
};
export const handle: Handle = sequence(handleParaglide, AuthHandle, authorize);
