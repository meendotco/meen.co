import type { AdapterAccountType } from '@auth/sveltekit/adapters';
import { relations } from 'drizzle-orm';
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	vector
} from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

const pool = postgres(DATABASE_URL, { max: 1 });

export const db = drizzle(pool);

export const users = pgTable('user', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name'),
	email: text('email').unique(),
	emailVerified: timestamp('emailVerified', { mode: 'date' }),
	image: text('image')
});

export const accounts = pgTable(
	'account',
	{
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text('type').$type<AdapterAccountType>().notNull(),
		provider: text('provider').notNull(),
		providerAccountId: text('providerAccountId').notNull(),
		refresh_token: text('refresh_token'),
		access_token: text('access_token'),
		expires_at: integer('expires_at'),
		token_type: text('token_type'),
		scope: text('scope'),
		id_token: text('id_token'),
		session_state: text('session_state')
	},
	(account) => [
		{
			compoundKey: primaryKey({
				columns: [account.provider, account.providerAccountId]
			})
		}
	]
);

export const sessions = pgTable('session', {
	sessionToken: text('sessionToken').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expires: timestamp('expires', { mode: 'date' }).notNull()
});

export const verificationTokens = pgTable(
	'verificationToken',
	{
		identifier: text('identifier').notNull(),
		token: text('token').notNull(),
		expires: timestamp('expires', { mode: 'date' }).notNull()
	},
	(verificationToken) => [
		{
			compositePk: primaryKey({
				columns: [verificationToken.identifier, verificationToken.token]
			})
		}
	]
);

export const authenticators = pgTable(
	'authenticator',
	{
		credentialID: text('credentialID').notNull().unique(),
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		providerAccountId: text('providerAccountId').notNull(),
		credentialPublicKey: text('credentialPublicKey').notNull(),
		counter: integer('counter').notNull(),
		credentialDeviceType: text('credentialDeviceType').notNull(),
		credentialBackedUp: boolean('credentialBackedUp').notNull(),
		transports: text('transports')
	},
	(authenticator) => [
		{
			compositePK: primaryKey({
				columns: [authenticator.userId, authenticator.credentialID]
			})
		}
	]
);

export const jobPost = pgTable(
	'jobPost',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		ownerId: text('ownerId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		description: text('description').notNull(),
		department: text('department').notNull(),
		location: text('location').notNull(),
		type: text('type').notNull(),
		status: text('status').notNull(),
		priority: text('priority').notNull(),
		salary: jsonb('salary').notNull(),
		responsibilities: jsonb('responsibilities').notNull(),
		requirements: jsonb('requirements').notNull(),
		benefits: jsonb('benefits').notNull(),
		tech_stack: jsonb('tech_stack').notNull(),
		remote_policy: text('remote_policy').notNull(),
		vector: vector('vector', { dimensions: 1536 }).notNull(),
		createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow()
	},
	(table) => [index('jobPost_embedding_idx').using('hnsw', table.vector.op('vector_cosine_ops'))]
);

export const linkedInProfile = pgTable(
	'linkedInProfile',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		url: text('url').notNull().unique(),
		data: jsonb('data').notNull(),
		profileImageB64: text('profileImageB64'),
		vector: vector('vector', { dimensions: 1536 }),
		createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
		expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull()
	},
	(table) => [
		index('linkedInProfile_embedding_idx').using('hnsw', table.vector.op('vector_cosine_ops'))
	]
);

export const candidates = pgTable(
	'candidate',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		jobPostId: text('jobPostId')
			.notNull()
			.references(() => jobPost.id, { onDelete: 'cascade' }),
		linkedInProfileId: text('linkedInProfileId')
			.notNull()
			.references(() => linkedInProfile.id, { onDelete: 'cascade' }),
		reasoning: text('reasoning'),
		matchScore: integer('matchScore'),
		createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('candidate_jobPostId_idx').on(table.jobPostId),
		index('candidate_linkedInProfileId_idx').on(table.linkedInProfileId)
	]
);

export const jobPostRelations = relations(jobPost, ({ one, many }) => ({
	owner: one(users, {
		fields: [jobPost.ownerId],
		references: [users.id]
	}),
	candidates: many(candidates)
}));

export const linkedInProfileRelations = relations(linkedInProfile, ({ many }) => ({
	candidates: many(candidates)
}));

export const candidateRelations = relations(candidates, ({ one }) => ({
	jobPost: one(jobPost, {
		fields: [candidates.jobPostId],
		references: [jobPost.id]
	}),
	linkedInProfile: one(linkedInProfile, {
		fields: [candidates.linkedInProfileId],
		references: [linkedInProfile.id]
	})
}));

export const waitlist = pgTable('waitlist', {
	email: text('email').primaryKey(),
	name: text('name'),
	company: text('company'),
	companySize: text('companySize'),
	role: text('role'),
	createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow()
});
