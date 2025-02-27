<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { parseCSV } from '$lib/utils/csvParser';
	import type { Map, Marker, CircleMarker, Polyline } from 'leaflet';

	let map: Map | null = null;
	let markers: { marker: CircleMarker; time: Date }[] = [];
	let lines: Polyline[] = [];
	let timestamps: Date[] = [];
	let selectedTime: number = 0; // Index in timestamps array

	onMount(async () => {
		if (!browser) return;
		const L = await import('leaflet');
		import('leaflet/dist/leaflet.css');

		const container = document.getElementById('map') as HTMLElement;
		if (!container) {
			console.error('❌ Map container not found!');
			return;
		}

		map = L.map(container).setView([51.505, -0.09], 13);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap contributors'
		}).addTo(map);

		console.log('✅ Map Loaded');

		// Load CSV Data AFTER Map is Initialized
		const points = await parseCSV('/data/allBirds_Winter2023_Radio-tracking_A-nigricollis.csv');
		console.log('📌 Loaded Points:', points);

		// Sort timestamps and store unique values
		timestamps = [...new Set(points.map((p) => new Date(p.time)))].sort(
			(a, b) => a.getTime() - b.getTime()
		);

		// Create circle markers
		points.forEach(({ lat, lng, name, time }, index) => {
			const marker = L.circleMarker([lat, lng], {
				color: index % 2 === 0 ? 'red' : 'blue', // Alternate colors
				fillColor: 'white',
				fillOpacity: 1,
				radius: 6, // Adjust for size
				weight: 2
			}).bindPopup(`${name} <br> ${time}`);

			markers.push({ marker, time: new Date(time) });
		});

		// Create movement lines
		for (let i = 1; i < points.length; i++) {
			const prev = points[i - 1];
			const curr = points[i];

			const line = L.polyline(
				[
					[prev.lat, prev.lng],
					[curr.lat, curr.lng]
				],
				{
					color: 'gray',
					weight: 2,
					dashArray: '5,5' // Dashed line for movement effect
				}
			);

			lines.push(line);
		}

		// Initially update the markers based on the first time value
		updateMarkers();
	});

	// Function to show only markers that match the selected time
	function updateMarkers() {
		if (!map) return;

		const currentTime = timestamps[selectedTime];
		console.log(`⏳ Showing markers for time: ${currentTime}`);

		markers.forEach(({ marker }) => map?.removeLayer(marker));
		lines.forEach((line) => map?.removeLayer(line));

		// Show markers for the selected time
		markers
			.filter(({ time }) => time.getTime() === currentTime.getTime())
			.forEach(({ marker }) => marker.addTo(map));

		// Show movement lines if time progresses
		if (selectedTime > 0) {
			lines[selectedTime - 1]?.addTo(map);
		}
	}
</script>

<div id="map"></div>

<!-- Time Slider UI -->
{#if timestamps.length > 0}
	<div class="slider-container">
		<input
			type="range"
			min="0"
			max={timestamps.length - 1}
			bind:value={selectedTime}
			on:input={updateMarkers}
		/>
		<p>{timestamps[selectedTime].toLocaleString()}</p>
	</div>
{/if}

<style>
	#map {
		width: 100%;
		height: 90vh;
		position: relative;
		z-index: 0;
	}

	.slider-container {
		position: absolute;
		bottom: 10px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(255, 255, 255, 0.8);
		padding: 10px;
		border-radius: 5px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	input[type='range'] {
		width: 300px;
	}
</style>
