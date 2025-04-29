// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import type { WebSocket } from 'ws';

import { ExtendedWebSocketServer } from '@/websocket/server.svelte';

export interface ExtendedWebSocket extends WebSocket {
	socketId: string;
	userId: string;
}

export interface ExtendedWebSocketServer extends WebSocketServer {
	clients: Set<ExtendedWebSocket>;
	clientInfo: Map<
		string,
		{
			userId: string | null;
			connectedAt: Date;
			lastActivity: Date;
		}
	>;
}

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: import('lucia').User | null;
			session: import('lucia').Session | null;
			getSession: () => Promise<import('@auth/sveltekit').Session | null>;
			wss?: import('ws').Server;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}

		type GoogleMeeting = {
			id: string;
			userId: string;
			jobPostId: string | null;
			googleMeetingId: string;
			summary: string | null;
			description: string | null;
			htmlLink: string | null;
			hangoutLink: string | null;
			startTime: Date | null;
			endTime: Date | null;
			attendees: any[] | null; // Consider defining a stricter type for attendees
			organizerEmail: string | null;
			status: string | null;
			conferenceData: any | null; // Consider defining a stricter type
			rawData: any; // Consider defining a stricter type (e.g., Google Calendar API Event type)
			createdAt: Date;
			updatedAt: Date;
		};

		type GoogleEmail = {
			id: string;
			userId: string;
			googleEmailId: string;
			googleThreadId: string;
			createdAt: Date;
			updatedAt: Date;
		};
	}
}

export {};
