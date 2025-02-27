import type { {{classuppertext}} } from '$lib/types';
import { create{{classuppertext}} } from '$lib/api';
import { redirect } from '@sveltejs/kit';

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const item = data.get('item');
		if (item && typeof item === 'string') {
			const data: {{classuppertext}} = JSON.parse(item);
			const response = await create{{classuppertext}}(data);
			console.log(response.status);
			if (response.status === 201) {
				redirect(303, '/{{classlowertext}}');
			} else {
				return { status: response.status, body: response.data };
			}
		}
	}
};