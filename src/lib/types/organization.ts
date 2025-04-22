export interface Organization {
	handle: string;
	logo?: string | null;
	theme?: string | null;
}

export interface OrganizationUpdatePayload {
	theme?: string | null;
	logo?: string | null;
}
