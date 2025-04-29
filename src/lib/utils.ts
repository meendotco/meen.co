import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Format a date string into a human-readable format
 * @param dateString ISO date string or Date object
 * @param options Formatting options
 */
export function formatDate(
	dateString: string | Date,
	options: Intl.DateTimeFormatOptions = {}
): string {
	if (!dateString) return '';

	const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	};

	return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}
