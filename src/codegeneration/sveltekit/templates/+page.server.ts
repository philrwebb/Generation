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
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const response = await delete{{classuppertext}}(id);
		if (response.status === 204) {
			redirect(303, '/{{classlowertext}}');
		} else {
			return { status: response.status, body: response.data };
		}
	}
};
