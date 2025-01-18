<script lang="ts">
	import { goto } from '$app/navigation';
	import { {{apiImports}} } from '$lib/api';
	import type { {{typeImports}} } from '$lib/types';
	import type { PageData } from './$types';

	export let data: PageData;

	{{assignments}}

	// Convert dob to YYYY-MM-DD format for date input
	// person.dob = new Date(person.dob).toISOString().split('T')[0];
    //{{converts}}

	// Save person data
	async function save{{classuppertext}}() {
		const response = await update{{classuppertext}}({{classlowertext}}.id, {{classlowertext}});
		if (response.status === 200) {
			goto('/{{classlowertext}}');
		} else {
			console.error('Failed to update {{classlowertext}}');
		}
	}
</script>
{{html}}
<style>
</style>
