import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function flyAndScale(node: HTMLElement) {
	node.style.transform = 'translateY(0) scale(1)';
	node.style.transition = 'transform 0.3s ease-in-out';
}
