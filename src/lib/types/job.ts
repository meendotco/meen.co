export type CreateStep = 'basic' | 'requirements' | 'review';
export type JobType = 'contract' | 'full-time' | 'internship' | 'part-time';
export type JobStatus = 'closed' | 'filled' | 'in-progress' | 'on-hold' | 'open';
export type JobPriority = 'high' | 'low' | 'medium' | 'urgent';
export type Currency = 'EUR' | 'GBP' | 'USD';
export type RequirementType = 'must-have' | 'nice-to-have';

export interface Salary {
	min: number;
	max: number;
	currency: Currency;
}

export interface Requirement {
	id: string;
	type: RequirementType;
	description: string;
	weight: number;
}

export interface Job {
	id: string;
	title: string;
	department: string;
	location: string;
	type: JobType;
	status: JobStatus;
	priority: JobPriority;
	salary: Salary;
	description: string;
	responsibilities: string[];
	requirements: Requirement[];
	benefits: string[];
	tech_stack: string[];
	remote_policy: string;
}
