import axios from 'axios';

import { GOOGLE_CSE_ID, GOOGLE_SEARCH_API_KEY } from '$env/static/private';

export async function searchGoogle(query: string) {
	// Read the API key and Custom Search Engine (CSE) ID from environment variables
	const apiKey = GOOGLE_SEARCH_API_KEY;
	const cx = GOOGLE_CSE_ID;

	if (!apiKey || !cx) {
		throw new Error('Missing GOOGLE_SEARCH_API_KEY or GOOGLE_CSE_ID environment variables.');
	}

	// Construct the request URL with the query parameter, API key, and CSE id
	const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;

	const response = await axios.get(url);
	return response.data;
}
