import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { customField } from '$lib/server/db/schema';

export const DELETE = async ({ locals, params }) => {
	const { jobId, customFieldId } = params;
	const user = locals.user;

	console.log('DELETE /api/job/[jobId]/customfield/[customFieldId] - Started', {
		jobId,
		customFieldId,
		userOrg: user.organizationHandle
	});

	try {
		// 1. Verify user owns the job post associated with the custom field
		const fieldToDelete = await db.query.customField.findFirst({
			where: and(eq(customField.id, customFieldId), eq(customField.jobPostId, jobId)),
			with: {
				jobPost: {
					columns: {
						ownerOrganizationHandle: true
					}
				}
			}
		});

		if (!fieldToDelete) {
			console.log('Custom field not found or job ID mismatch');
			return json({ error: 'Custom field not found' }, { status: 404 });
		}

		if (fieldToDelete.jobPost.ownerOrganizationHandle !== user.organizationHandle) {
			console.log('User permission denied');
			return json({ error: 'Permission denied' }, { status: 403 });
		}

		// 2. Delete the custom field (cascading delete should handle customFieldValues)
		await db.delete(customField).where(eq(customField.id, customFieldId));

		console.log('Custom field deleted successfully:', customFieldId);
		return json({ message: 'Custom field deleted' }, { status: 200 });
	} catch (error) {
		console.error('Error deleting custom field:', error);
		return json(
			{ error: 'Failed to delete custom field', details: error.message },
			{ status: 500 }
		);
	}
};
