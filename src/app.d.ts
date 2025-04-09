// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { users } from '$lib/server/db/schema';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: typeof users.$inferSelect;
			auth: {
				user: {
					email: string;
				};
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
