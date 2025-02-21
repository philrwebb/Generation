import { {{apiImports}}} from '$lib/api';
import type { ReferenceBase } from '$lib/types';
export const load = async () => {
	const ReferenceData: Record<string, ReferenceBase[]> = {};

	const [{{responses}}] = await Promise.all([
        {{promises}}
	]);

	if (
        {{statuscheck}}
	) {
        {{assignments}}
		return {
			ReferenceData
		};
	} else {
		throw new Error('Failed to load data');
	}
};