// src/hooks.client.ts
import type { HandleClientError } from '@sveltejs/kit';
import { toast } from 'svelte-sonner';

export const handleError: HandleClientError = ({ error, status, message }) => {
	// Keep UX minimal: show a toast, let +error.svelte render too
	toast.error(message || error?.message || `Error ${status}`);
	// Return nothing so Kit continues its normal flow
};
