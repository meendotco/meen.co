import axios from 'axios';
import { and, eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { accounts } from '$lib/server/db/schema';

export async function getLinkedinProfile(userId: string) {
	console.log('Getting LinkedIn profile for user ID:', userId);

	// Query the accounts table for the LinkedIn token
	const linkedinAccount = await db.query.accounts.findFirst({
		where: and(
			eq(accounts.userId, userId),
			eq(accounts.provider, 'linkedin') // Filter by provider 'linkedin'
		),
		columns: {
			access_token: true // Select only the access token
		}
	});

	console.log('LinkedIn account found:', linkedinAccount ? 'yes' : 'no');

	// Check if the account and access token exist
	if (!linkedinAccount?.access_token) {
		console.error('LinkedIn access token not found for user:', userId);
		return null; // Return null or throw an error if token not found
	}

	const accessToken = linkedinAccount.access_token;
	console.log('Access token retrieved successfully');

	// Fetch profile from LinkedIn API
	try {
		console.log('Fetching profile from LinkedIn API...');
		// Use the LinkedIn /userinfo endpoint
		const response = await fetch('https://api.linkedin.com/v2/userinfo', {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});

		console.log('LinkedIn API response status:', response.status);

		if (!response.ok) {
			// Throw an error if the API request failed
			const errorText = await response.text();
			console.error(`LinkedIn API request failed with status ${response.status}:`, errorText);
			throw new Error(`LinkedIn API request failed with status ${response.status}: ${errorText}`);
		}

		// Parse the JSON response
		const profile = await response.json();

		console.log('Fetched LinkedIn profile:', profile);

		return profile; // Return the fetched profile data
	} catch (error) {
		console.error('Error fetching LinkedIn profile:', error);
		return null; // Return null in case of API errors
	}
}

export async function pullDownData(snapshot_id: string) {
	const response = await axios.get(
		`https://api.brightdata.com/datasets/v3/snapshot/${snapshot_id}?format=json`,
		{
			headers: {
				Authorization: 'Bearer 4e76f565f38cb3a8405a1f6d0e29d69125006da7266b6ff6d69ffcbc3a14fa99'
			}
		}
	);
	return response.data;
}

export async function getFullLinkedinProfile() {
	const data = JSON.stringify([{ url: 'https://www.linkedin.com/in/makkadotgg/' }]);

	const response = await axios.post(
		'https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l1viktl72bvl7bjuj0&include_errors=true',
		data,
		{
			headers: {
				Authorization: 'Bearer 4e76f565f38cb3a8405a1f6d0e29d69125006da7266b6ff6d69ffcbc3a14fa99',
				'Content-Type': 'application/json'
			}
		}
	);

	const responseData = await response.data;

	const snapshot_id = responseData.snapshot_id;
	while (true) {
		const progress = await pullDownData(snapshot_id);
		console.log(progress);
		if (progress.status !== 'running') {
			return progress;
		}
		await new Promise((resolve) => setTimeout(resolve, 30000));
	}
}
