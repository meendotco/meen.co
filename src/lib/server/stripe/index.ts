// src/lib/server/stripe.ts
import { eq, sql } from 'drizzle-orm';
import Stripe from 'stripe';

import { db } from '@/server/db/schema';
import { organizationBilling, users } from '@/server/db/schema';
import { STRIPE_SECRET_KEY } from '$env/static/private';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2025-03-31.basil',
	typescript: true
});

// How many seats should this org be paying for?
export async function calcSeatCount(handle: string) {
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(users)
		.where(eq(users.organizationHandle, handle));
	return count;
}

/**
 * Sync Stripe ↔︎ DB after any membership change
 */
export async function syncSeatQuantity(handle: string) {
	const seats = await calcSeatCount(handle);

	const billing = await db
		.select()
		.from(organizationBilling)
		.where(eq(organizationBilling.handle, handle))
		.then((rows) => rows[0]);
	if (!billing) return; // org might still be trialling

	if (billing.currentQuantity === seats) return; // nothing to do

	await stripe.subscriptionItems.update(billing.subscriptionItemId, {
		quantity: seats,
		proration_behavior: 'create_prorations',
		billing_thresholds: {
			usage_gte: seats
		}
	});

	await db
		.update(organizationBilling)
		.set({ currentQuantity: seats })
		.where(eq(organizationBilling.handle, handle));
}
