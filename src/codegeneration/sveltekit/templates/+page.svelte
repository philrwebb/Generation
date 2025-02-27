<script lang="ts">
	import type { {{typeImports}}, ReferenceBase } from '$lib/types';
	let { data } = $props();
	let pbaseList: {{classuppertext}}[] = data.{{classlowertext}}s;
	let showAll = $state(false);
	let showDeleteModal = $state(false);
	let deleteId: number | null = $state(null);

	function getTypeDescription(id: number, typeName: string): string {
		if (!data.ReferenceData[typeName]) return '';
		const item = data.ReferenceData[typeName].find((item: ReferenceBase) => item.id === id);
		return item ? item.typeLongDescription : '';
	}

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