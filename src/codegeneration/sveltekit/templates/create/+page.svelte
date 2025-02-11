<script lang="ts">
	import { goto } from '$app/navigation';
	import type { {{typeImports}} } from '$lib/types';

	let { data } = $props();

    {{assignments}}
	let item: Partial<Person> = $state({
		givenNames: '',
		lastName: '',
		dob: new Date().toISOString().split('T')[0],
		GenderTypeid: 0,
		active: true
	});
	let gendertypes: GenderType[] = data.gendertype;
</script>

{{html}}
<h1 class="my-6 text-center text-2xl font-bold">Create Person</h1>
<form method="POST" action="?/create" class="grid grid-cols-2 gap-4">
	<input type="hidden" name="person" value={JSON.stringify(item)} />
	<div class="flex items-center">
		<label for="givenNames" class="w-1/3">Given Names:</label>
		<input
			id="givenNames"
			type="text"
			bind:value={item.givenNames}
			class="w-2/3 rounded border border-gray-300 p-2"
		/>
	</div>
	<div class="flex items-center">
		<label for="lastName" class="w-1/3">Last Name:</label>
		<input
			id="lastName"
			type="text"
			bind:value={item.lastName}
			class="w-2/3 rounded border border-gray-300 p-2"
		/>
	</div>
	<div class="flex items-center">
		<label for="dob" class="w-1/3">Dob:</label>
		<input
			id="dob"
			type="date"
			bind:value={item.dob}
			class="w-2/3 rounded border border-gray-300 p-2"
		/>
	</div>
	<div class="flex items-center">
		<label for="GenderType" class="w-1/3"> Gender Type:</label>
		<select
			id="GenderType"
			bind:value={item.GenderTypeid}
			class="w-2/3 rounded border border-gray-300 p-2"
		>
			{#each gendertypes as item}
				<option value={item.id}>{item.typeLongDescription}</option>
			{/each}
		</select>
	</div>
	<div class="col-span-2 flex justify-between">
		<button type="submit" class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-700"
			>Save</button
		>
		<button
			type="button"
			onclick={() => goto('/person')}
			class="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-700">Cancel</button
		>
	</div>
</form>

<style>
</style>
