<script lang="ts">
	import { goto } from '$app/navigation';
	import type { {{typeImports}} } from '$lib/types';

	let { data } = $props();
	let item: {{classuppertext}} = $state(data.{{classlowertext}});

	{{converts}}

</script>
{{html}}
<style>
</style>
