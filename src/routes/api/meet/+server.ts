// src/routes/api/gmail/+server.ts
import { GoogleService } from '$lib/server/google/service';
import { error } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		throw error(401, 'Unauthenticated');
	}

	try {
		const googleService = await GoogleService.create(user.id);

		const calendarEvents = await googleService.getCalendarEvents();

		return json(calendarEvents);
	} catch (err: any) {
		console.error('Error fetching Calendar events:', err);
		throw error(500, err.message || 'Failed to fetch Calendar events');
	}
};
