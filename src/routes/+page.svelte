<script lang="ts">
	import { SignIn } from '@auth/sveltekit/components';
	let { data } = $props();

	let profile = $state(null);

	async function getProfile() {
		const response = await fetch('/api/profile');
		const data = await response.json();
		profile = data;
	}
</script>

<div>
	<SignIn provider="linkedin" signInPage="signin" />
	{data.session?.user?.email}
</div>

<div>
	<button onclick={getProfile}>Get Profile</button>
	{JSON.stringify(profile)}
</div>
