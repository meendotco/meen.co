/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PersonEndpointResponse } from 'proxycurl-js-linkedin-profile-scraper';
import type { InferSelectModel } from 'drizzle-orm';

import type {
	candidates as candidatesTable,
	customField as customFieldTable,
	customFieldValue as customFieldValueTable,
	linkedInProfile as linkedInProfileTable
} from '$lib/server/db/schema';
import type { JobData } from '@/server/job';

type LinkedInProfileSelect = InferSelectModel<typeof linkedInProfileTable> & {
	data?: PersonEndpointResponse | null;
};
type CustomFieldSelect = InferSelectModel<typeof customFieldTable>;
type CustomFieldValueSelect = InferSelectModel<typeof customFieldValueTable> & {
	customField: CustomFieldSelect;
};

// Use a type similar to the one in CandidateTable.svelte for richer data
export type CandidateForTable = InferSelectModel<typeof candidatesTable> & {
	linkedInProfile: LinkedInProfileSelect | null;
	matchScore?: number | null;
	reasoning?: string | null;
	customFieldValues?: CustomFieldValueSelect[] | null;
};

/**
 * Safely retrieves a nested property from an object using dot notation
 */
const safeGet = (obj: any, path: string, defaultValue: string = ''): string => {
	const trimmedPath = path.trim();
	if (!trimmedPath) return defaultValue;

	const value = trimmedPath
		.split('.')
		.reduce((o, k) => (o && o[k] !== undefined && o[k] !== null ? o[k] : undefined), obj);

	return value !== undefined && value !== null ? String(value) : defaultValue;
};

/**
 * Formats a list of objects into XML tags with nested fields
 */
const formatObjectListToTags = (
	items: unknown[] | undefined,
	parentTag: string,
	itemTag: string,
	fields: { jsonKey: string; xmlTag: string }[]
): string => {
	if (!Array.isArray(items) || items.length === 0) return '';

	const itemStrings = items
		.map((item: any) => {
			const fieldTags = fields
				.map((f) => {
					const value = safeGet(item, f.jsonKey);
					return value ? `            <${f.xmlTag}>${value}</${f.xmlTag}>` : '';
				})
				.filter(Boolean)
				.join('\n');

			return fieldTags ? `        <${itemTag}>\n${fieldTags}\n        </${itemTag}>` : '';
		})
		.filter(Boolean);

	return itemStrings.length > 0
		? `    <${parentTag}>\n${itemStrings.join('\n')}\n    </${parentTag}>`
		: '';
};

/**
 * Formats a simple list into XML tags
 */
const formatSimpleListToTags = (
	items: unknown[] | undefined,
	parentTag: string,
	itemTag: string,
	jsonKey?: string
): string => {
	if (!Array.isArray(items) || items.length === 0) return '';

	const itemStrings = items
		.map((item: any) => {
			const value = jsonKey
				? safeGet(item, jsonKey)
				: item !== null && item !== undefined
					? String(item)
					: '';
			return value ? `        <${itemTag}>${value}</${itemTag}>` : '';
		})
		.filter(Boolean);

	return itemStrings.length > 0
		? `    <${parentTag}>\n${itemStrings.join('\n')}\n    </${parentTag}>`
		: '';
};

/**
 * Formats salary information into XML tags
 */
const formatSalaryToTags = (salary: unknown): string => {
	if (salary && typeof salary === 'object') {
		const s = salary as { min?: number; max?: number; currency?: string; period?: string };
		let tags = '';
		if (s.min) tags += `            <min_salary>${s.min}</min_salary>\n`;
		if (s.max) tags += `            <max_salary>${s.max}</max_salary>\n`;
		if (s.currency) tags += `            <currency>${s.currency}</currency>\n`;
		if (s.period) tags += `            <period>${s.period}</period>\n`;
		return tags ? `    <salary_info>\n${tags.trim()}\n    </salary_info>` : '';
	}
	return '';
};

/**
 * Generates XML representation of a job post for embedding
 */
export function generateJobPostEmbeddingInput(jobPost: JobData): string {
	const parts = [
		`<jobPost>`,
		`    <title>${safeGet(jobPost, 'title')}</title>`,
		`    <description>${safeGet(jobPost, 'description')}</description>`,
		jobPost.location ? `    <location>${safeGet(jobPost, 'location')}</location>` : '',
		jobPost.department ? `    <department>${safeGet(jobPost, 'department')}</department>` : '',
		jobPost.type ? `    <job_type>${safeGet(jobPost, 'type')}</job_type>` : '',
		jobPost.remote_policy
			? `    <remote_policy>${safeGet(jobPost, 'remote_policy')}</remote_policy>`
			: '',
		formatSimpleListToTags(
			jobPost.responsibilities as string[] | undefined,
			'responsibilities',
			'responsibility'
		),
		formatSimpleListToTags(
			jobPost.requirements as string[] | undefined,
			'requirements',
			'requirement'
		),
		formatSimpleListToTags(jobPost.tech_stack as string[] | undefined, 'tech_stack', 'tech'),
		formatSimpleListToTags(jobPost.benefits as string[] | undefined, 'benefits', 'benefit'),
		formatSalaryToTags(jobPost.salary),
		`</jobPost>`
	];

	const jobPostInputStringTagged = parts.filter((part) => part && part.trim() !== '').join('\n');
	return jobPostInputStringTagged.replace(/\n\s*\n/g, '\n').trim();
}

/**
 * Generates XML representation of a job post with company information for embedding
 */
export function generateJobPostEmbeddingInputFull(jobPost: JobData): string {
	const parts = [
		`<jobPost>`,
		`    <company>${safeGet(jobPost, 'company_id')}</company>`,
		`    <title>${safeGet(jobPost, 'title')}</title>`,
		`    <description>${safeGet(jobPost, 'description')}</description>`,
		jobPost.location ? `    <location>${safeGet(jobPost, 'location')}</location>` : '',
		jobPost.department ? `    <department>${safeGet(jobPost, 'department')}</department>` : '',
		jobPost.type ? `    <job_type>${safeGet(jobPost, 'type')}</job_type>` : '',
		jobPost.remote_policy
			? `    <remote_policy>${safeGet(jobPost, 'remote_policy')}</remote_policy>`
			: '',
		formatSimpleListToTags(
			jobPost.responsibilities as string[] | undefined,
			'responsibilities',
			'responsibility'
		),
		formatSimpleListToTags(
			jobPost.requirements as string[] | undefined,
			'requirements',
			'requirement'
		),
		formatSimpleListToTags(jobPost.tech_stack as string[] | undefined, 'tech_stack', 'tech'),
		formatSimpleListToTags(jobPost.benefits as string[] | undefined, 'benefits', 'benefit'),
		formatSalaryToTags(jobPost.salary),
		`</jobPost>`
	];

	const jobPostInputStringTagged = parts.filter((part) => part && part.trim() !== '').join('\n');
	return jobPostInputStringTagged.replace(/\n\s*\n/g, '\n').trim();
}

/**
 * Generates a Markdown table representation of candidates.
 */
export function generateCandidateTable(candidates: CandidateForTable[]): string {
	if (!candidates || candidates.length === 0) {
		return 'No candidates to display.';
	}

	// --- Determine Headers ---
	const baseHeaders = ['Name', 'Title', 'Score', 'Reasoning'];
	const customFieldHeaders: string[] = [];
	const customFieldMap = new Map<string, CustomFieldSelect>();

	// Collect all unique custom field names and their definitions from the first candidate
	// Assuming custom fields are consistent across candidates for the same job
	if (candidates[0]?.customFieldValues) {
		for (const cfv of candidates[0].customFieldValues) {
			if (cfv.customField && !customFieldMap.has(cfv.customField.name)) {
				customFieldMap.set(cfv.customField.name, cfv.customField);
				customFieldHeaders.push(cfv.customField.name);
			}
		}
	}

	const allHeaders = [...baseHeaders, ...customFieldHeaders];

	// --- Build Header Row ---
	const headerRow = `| ${allHeaders.join(' | ')} |`;
	const separatorRow = `| ${allHeaders.map(() => '---').join(' | ')} |`;

	// --- Build Data Rows ---
	const dataRows = candidates.map((candidate) => {
		const profileData = candidate.linkedInProfile?.data;
		const name = `${profileData?.first_name ?? ''} ${profileData?.last_name ?? ''}`.trim() || 'N/A';
		const title = profileData?.headline ?? 'N/A';
		const score = candidate.matchScore != null ? `${candidate.matchScore}/100` : 'N/A';
		const reasoning = candidate.reasoning ?? 'N/A';

		// Sanitize potential markdown characters in string data (like '|')
		const sanitize = (str: string | null | undefined): string =>
			str ? String(str).replace(/\|/g, '\\|') : 'N/A';

		const baseData = [sanitize(name), sanitize(title), score, sanitize(reasoning)];

		const customFieldValues: string[] = [];
		for (const headerName of customFieldHeaders) {
			const fieldDef = customFieldMap.get(headerName);
			const cfv = candidate.customFieldValues?.find((v) => v.customFieldId === fieldDef?.id);
			let value = cfv?.value ?? 'N/A';

			// Format value based on type if needed (e.g., date)
			if (fieldDef?.type === 'date' && value !== 'N/A') {
				try {
					value = new Date(value).toLocaleDateString();
				} catch {
					// Ignore invalid date format
				}
			}
			customFieldValues.push(sanitize(value));
		}

		const rowData = [...baseData, ...customFieldValues];
		return `| ${rowData.join(' | ')} |`;
	});
	console.log([headerRow, separatorRow, ...dataRows].join('\n'));

	return [headerRow, separatorRow, ...dataRows].join('\n');
}

/**
 * Generates XML representation of a LinkedIn profile for embedding
 */
export function generateLinkedInProfileEmbeddingInput(profile: PersonEndpointResponse): string {
	if (!profile) return '';

	const city = safeGet(profile, 'city');
	const state = safeGet(profile, 'state');
	const country = safeGet(profile, 'country_full_name');
	const locationParts = [city, state, country].filter(Boolean);
	const locationString =
		locationParts.length > 0 ? `<location>${locationParts.join(', ')}</location>` : '';

	const parts = [
		`<linkedInProfile>`,
		`    <name>${safeGet(profile, 'full_name')}</name>`,
		`    <url>https://www.linkedin.com/in/${profile.public_identifier}</url>`,
		safeGet(profile, 'headline') ? `    <headline>${safeGet(profile, 'headline')}</headline>` : '',
		safeGet(profile, 'occupation')
			? `    <occupation>${safeGet(profile, 'occupation')}</occupation>`
			: '',
		locationString ? `    ${locationString}` : '',
		safeGet(profile, 'industry') ? `    <industry>${safeGet(profile, 'industry')}</industry>` : '',
		safeGet(profile, 'summary') ? `    <summary>${safeGet(profile, 'summary')}</summary>` : '',
		formatSimpleListToTags(profile.skills ?? [], 'skills', 'skill'),
		formatObjectListToTags(profile.experiences, 'experiences', 'experience_entry', [
			{ jsonKey: 'title', xmlTag: 'title' },
			{ jsonKey: 'location', xmlTag: 'location' },
			{ jsonKey: 'description', xmlTag: 'description' }
		]),
		formatObjectListToTags(profile.education, 'education', 'education_entry', [
			{ jsonKey: 'school', xmlTag: 'school' },
			{ jsonKey: 'degree_name', xmlTag: 'degree' },
			{ jsonKey: 'field_of_study', xmlTag: 'field_of_study' },
			{ jsonKey: 'description', xmlTag: 'description' }
		]),
		formatObjectListToTags(profile.certifications, 'certifications', 'certification_entry', [
			{ jsonKey: 'name', xmlTag: 'name' },
			{ jsonKey: 'authority', xmlTag: 'authority' }
		]),
		formatObjectListToTags(profile.accomplishment_projects, 'projects', 'project_entry', [
			{ jsonKey: 'title', xmlTag: 'title' },
			{ jsonKey: 'description', xmlTag: 'description' }
		]),
		formatObjectListToTags(
			profile.accomplishment_publications,
			'publications',
			'publication_entry',
			[
				{ jsonKey: 'name', xmlTag: 'name' },
				{ jsonKey: 'publisher', xmlTag: 'publisher' },
				{ jsonKey: 'description', xmlTag: 'description' }
			]
		),
		formatObjectListToTags(profile.accomplishment_honors_awards, 'honors_awards', 'award_entry', [
			{ jsonKey: 'title', xmlTag: 'title' },
			{ jsonKey: 'issuer', xmlTag: 'issuer' },
			{ jsonKey: 'description', xmlTag: 'description' }
		]),
		formatObjectListToTags(profile.volunteer_work, 'volunteer_work', 'volunteer_entry', [
			{ jsonKey: 'title', xmlTag: 'title' },
			{ jsonKey: 'description', xmlTag: 'description' }
		]),
		formatSimpleListToTags(profile.accomplishment_courses, 'courses', 'course', 'name'),
		formatSimpleListToTags(profile.languages, 'languages', 'language'),
		`</linkedInProfile>`
	];

	const profileInputStringTagged = parts.filter((part) => part && part.trim() !== '').join('\n');
	return profileInputStringTagged.replace(/\n\s*\n/g, '\n').trim();
}
