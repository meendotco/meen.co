import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { count } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { jobPost, linkedInProfile } from '$lib/server/db/schema';
import { candidates } from '$lib/server/db/schema';

const cache = new Map<string, number>();
export const load = async (event: RequestEvent) => {
	if (!event.locals.user) {
		throw redirect(302, '/signin');
	}

	if (!event.locals.user.organizationHandle) {
		return {
			user: event.locals.user,
			org: null,
			noOrgMessage: "You don't have an organization"
		};
	}

	const orgId = event.params.org;
	if (orgId !== event.locals.user.organizationHandle) {
		return {
			user: event.locals.user,
			org: null,
			noOrgMessage: 'You are not authorized to access this organization'
		};
	}

	const cachedCandidates = cache.get('totalCandidates');
	const cachedJobs = cache.get('totalJobs');
	const cachedPeople = cache.get('totalPeople');

	if (cachedCandidates !== undefined && cachedJobs !== undefined && cachedPeople !== undefined) {
		return {
			totalCandidates: cachedCandidates,
			totalJobs: cachedJobs,
			totalPeople: cachedPeople
		};
	}

	const [totalCandidates, totalJobs, totalPeople] = await Promise.all([
		db.select({ count: count() }).from(candidates),
		db.select({ count: count() }).from(jobPost),
		db.select({ count: count() }).from(linkedInProfile)
	]);

	cache.set('totalCandidates', totalCandidates[0].count);
	cache.set('totalJobs', totalJobs[0].count);
	cache.set('totalPeople', totalPeople[0].count);

	return {
		totalCandidates: cache.get('totalCandidates'),
		totalJobs: cache.get('totalJobs'),
		totalPeople: cache.get('totalPeople'),
		org: event.locals.user.organizationHandle
	};
};
