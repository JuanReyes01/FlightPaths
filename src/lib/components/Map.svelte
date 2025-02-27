<script lang="ts">
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';

	let mapDiv: HTMLDivElement;
	let map = null;
	let L: any; // Leaflet will be imported later

	export let center: [number, number] = [4.624335, -74.063644];
	export let zoom: number = 13;

	onMount(async () => {
		if (typeof window !== 'undefined') {
			const leaflet = await import('leaflet');
			L = leaflet.default;

			map = L.map(mapDiv).setView(center, zoom);

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© OpenStreetMap contributors'
			}).addTo(map);
		}
	});
</script>

<div bind:this={mapDiv} style="height: 500px; width: 100%;"></div>
