<script lang="ts">
	import type { {{typeImports}} } from '$lib/types';
	import type { PageData } from './$types';
	import { {{apiImports}} } from '$lib/api';

	export let data: PageData;

    {{assignments}}

	async function remove{{classuppertext}}(id: number) {
		if (confirm('Are you sure you want to delete this {{classlowertext}}?')) {
			const response = await delete{{classuppertext}}(id);
			if (response.status === 204) {
                {{deleteLogic}}
			} else {
				console.error('Failed to delete {{classlowertext}}');
			}
		}
	}
    {{getRefDataLogic}}

</script>

{{html}}

<style>
	.grid-container {
		display: grid;
		grid-template-columns: repeat({{noOfCols}}, 1fr);
		gap: 2px;
	}

	.grid-header {
		font-weight: bold;
		background-color: lightskyblue;
		padding: 0.5rem;
		border: 1px solid #ccc;
		text-align: center;
	}

	.grid-item {
		padding: 0.5rem;
		border: 1px solid #ccc;
	}

	{{variablestyle}}

</style>