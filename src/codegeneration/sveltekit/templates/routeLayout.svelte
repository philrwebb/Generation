<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		if (window.location.pathname === '/') {
			goto('/person');
		}
	});
</script>

<nav class="menu">
	<ul class="menu-list">
        {{menuitems}}
	</ul>
</nav>

<div class="container">
	{@render children()}
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
	}

	.menu {
		background-color: #f8f9fa;
		padding: 1rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid #dee2e6;
	}

	.menu-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		gap: 1rem;
	}

	.menu-link {
		text-decoration: none;
		color: #007bff;
		font-weight: bold;
	}

	.menu-link:hover {
		text-decoration: underline;
	}
</style>
