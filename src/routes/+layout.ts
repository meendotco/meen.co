import posthog from 'posthog-js';

import { dev } from '$app/environment';
import { browser } from '$app/environment';

if (browser && !dev) {
	posthog.init('phc_ASQ4JmIcsApUxGdN1mpoUT9pXAyqi7FMJCQwrDi5jCe', {
		api_host: 'https://us.i.posthog.com',
		person_profiles: 'identified_only' // or 'always' to create profiles for anonymous users as well
	});
}
