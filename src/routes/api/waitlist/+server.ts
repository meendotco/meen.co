import { waitListEmail } from '@/server/mail';

export const POST = async ({ request }) => {
	const { email, name, company, companySize, role } = await request.json();
	await waitListEmail(email, name, company, companySize, role);
	return new Response(JSON.stringify({ message: 'Email sent' }), { status: 200 });
};
