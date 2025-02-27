import type { {{classuppertext}} } from '$lib/types';
import { get{{classuppertext}}ById, update{{classuppertext}} } from '$lib/api';
import { redirect } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const id = +params.id;
	const [{{classlowertext}}Response] = await Promise.all([get{{classuppertext}}ById(id)]);

	if ({{classlowertext}}Response.status === 200) {
		const {{classlowertext}}: {{classuppertext}} = {{classlowertext}}Response.data;
		return { {{classlowertext}} };
	} else {
		throw new Error('Failed to load data');
	}
};

export const actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		const {{classlowertext}} = data.get('item');
		if ({{classlowertext}} && typeof {{classlowertext}} === 'string') {
			const data = JSON.parse({{classlowertext}});
			const id: number = data.id;
			const response = await update{{classuppertext}}(id, data);
			if (response.status === 200) {
				redirect(303, '/{{classlowertext}}');
			} else {
				return { status: response.status, body: response.data };
			}
		}
	}
};
