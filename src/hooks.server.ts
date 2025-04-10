import { type Handle, type RequestEvent } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { eq } from 'drizzle-orm';

import { building } from '$app/environment';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import type { ExtendedGlobal } from '$lib/websocket/server.svelte';
import { GlobalThisWSS } from '$lib/websocket/server.svelte';

import type { ExtendedWebSocket } from './app';
import { handle as AuthHandle } from './auth';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const authorizationHandle: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith('/api') && !event.url.pathname.startsWith('/dashboard')) {
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
	event.locals.session = auth;
	return resolve(event);
};

const startupWebsocketServer = async (event: RequestEvent) => {
	const wss = (globalThis as ExtendedGlobal)[GlobalThisWSS];
	if (wss !== undefined) {
		wss.on('connection', async (ws: ExtendedWebSocket) => {
			const user = event.locals.user;

			if (!user) {
				return;
			}
			ws.userId = user.id;
		});
	}
};

const webSocketHandle: Handle = async ({ event, resolve }) => {
	await startupWebsocketServer(event);
	if (!building) {
		const wss = (globalThis as ExtendedGlobal)[GlobalThisWSS];
		if (wss !== undefined) {
			event.locals.wss = wss;
		}
	}

	const response = await resolve(event, {
		filterSerializedResponseHeaders: (name: string) => name === 'content-type'
	});

	return response;
};
export const handle: Handle = sequence(
	handleParaglide,
	AuthHandle,
	authorizationHandle,
	webSocketHandle
);
