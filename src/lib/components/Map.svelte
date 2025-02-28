<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { map } from '$lib/stores/MapStore';
	import type { Map } from 'leaflet';

	let leafletMap: Map | null = null;
	let container: HTMLDivElement | null = null;
	let resizeHandler: (() => void) | null = null;

	onMount(async () => {
		if (typeof window === 'undefined' || !container) return;

		const L = await import('leaflet');
		import('leaflet/dist/leaflet.css');

		// Ensure the container has a proper size before initializing Leaflet
		container.style.height = '100vh';
		container.style.width = '100%';

		// Wait for Svelte to finish rendering before initializing the map
		await tick();

		leafletMap = L.map(container).setView([4.381917405828121, -74.35136899999998], 13);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap contributors'
		}).addTo(leafletMap);

		// Ensure the map is fully rendered before resizing
		requestAnimationFrame(() => {
			leafletMap?.invalidateSize();
			console.log('🔄 Leaflet map size invalidated');
		});

		// Handle window resizing
		resizeHandler = () => {
			leafletMap?.invalidateSize();
			console.log('🔄 Window resized, Leaflet map updated');
		};
		window.addEventListener('resize', resizeHandler);

		// Store map in Svelte store
		map.set(leafletMap);
		console.log('✅ Leaflet map initialized and set in store:', leafletMap);
	});

	// Ensure cleanup when component is destroyed
	onDestroy(() => {
		if (resizeHandler) {
			window.removeEventListener('resize', resizeHandler);
		}
		if (leafletMap) {
			leafletMap.remove();
			console.log('🗑️ Leaflet map removed');
		}
	});
</script>

<!-- ✅ Ensure the map container is properly styled -->
<div bind:this={container} class="map-container"></div>

<style>
	.map-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		height: 100vh;
		width: 100%;
		z-index: 0;
		background: white; /* Ensures no visual glitches */
	}
</style>
