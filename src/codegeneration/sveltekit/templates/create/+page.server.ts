import type { {{typeImports}} } from '$lib/types';
import { {{apiImports}}} from '$lib/api';
import { redirect } from '@sveltejs/kit';

export const load = async () => {
	const [{{responses}}] = await Promise.all([{{promises}}]);

	if ({{statuscheck}}) {
		{{assignments}}
		return { {{returns}} };
	} else {
		throw new Error('Failed to load data');
	}
};

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const item = data.get('item');
		if (item && typeof item === 'string') {
			const data: {{classuppertext}} = JSON.parse(item);
			const response = await create{{classupertext}}(data);
			console.log(response.status);
			if (response.status === 201) {
				redirect(303, '/{{classlowertext}}');
			} else {
				return { status: response.status, body: response.data };
			}
		}
	}
};
