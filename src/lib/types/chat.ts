export interface LinkedInProfileData {
	first_name?: string;
	last_name?: string;
	headline?: string;
	profile_pic_url?: string;
}

export interface Candidate {
	id: string;
	linkedInProfile: {
		data: LinkedInProfileData;
		url?: string;
		profileImageB64?: string;
	};
	reasoning?: string | null;
	matchScore?: number | null;
	handle?: string | null;
}

export interface ToolCallData {
	id: string;
	name: string;
	args: Record<string, unknown>;
	result: Record<string, unknown> | boolean | number | string | null;
	createdAt: Date;
	chatMessageId: string;
}

export interface Message {
	id: string;
	content: string;
	role: 'assistant' | 'user';
	createdAt: Date;
	chatId: string;
	toolcalls: ToolCallData[];
}
