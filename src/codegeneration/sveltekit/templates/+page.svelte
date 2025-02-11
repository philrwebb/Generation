<script lang="ts">
	import type { {{typeImports}} } from '$lib/types';
	let { data } = $props();
	let pbaseList: {{classuppertext}}[] = data.{{classlowertext}}s;
	{{assignments}}
	let showAll = $state(false);
	let showDeleteModal = $state(false);
	let deleteId: number | null = $state(null);

	{{getRefDataLogic}}

	function filteredActive() {
		return showAll ? pbaseList : pbaseList.filter((item) => item.active);
	}
	function openDeleteModal(id: number) {
		deleteId = id;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		deleteId = null;
	}
</script>

{{html}}