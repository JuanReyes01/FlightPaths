<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { parseCSV } from '$lib/utils/csvParser';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import type { Map, CircleMarker, Polyline } from 'leaflet';
	import { individuals, setIndividuals } from '$lib/stores/IndividualStore';

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

		console.log('✅ Map initialized');

		const points = await parseCSV('/data/allBirds_Winter2023_Radio-tracking_A-nigricollis.csv');
		setIndividuals(points); // ✅ Ensure individuals are set

		if (!points || points.length === 0) {
			console.warn('⚠️ No points found in parsed CSV');
			return;
		}

		console.log('📌 Loaded Points:', points);

		timestamps = [
			...new Set(
				points
					.map((p) => {
						const parts = p.DateTime.match(/(\d+)\/(\d+)\/(\d+) (\d+):(\d+)/);
						if (!parts) {
							console.warn(`🚨 Invalid DateTime format: ${p.DateTime}`);
							return null;
						}

						const [, month, day, year, hours, minutes] = parts.map(Number);
						const parsedDate = new Date(year, month - 1, day, hours, minutes);

						//console.log(`🕒 Fixed DateTime: ${p.DateTime} → ${parsedDate}`);
						return isNaN(parsedDate.getTime()) ? null : parsedDate;
					})
					.filter(Boolean)
			)
		].sort((a, b) => a.getTime() - b.getTime());

		//console.log('📆 Corrected timestamps:', timestamps);

		//console.log('📆 Extracted timestamps:', timestamps);

		points.forEach(({ lat, lng, TagId, DateTime }) => {
			if (isNaN(lat) || isNaN(lng)) {
				console.warn(`🚨 Invalid coordinates for ${TagId}: lat=${lat}, lng=${lng}`);
				return;
			}

			//console.log(`📍 Adding Marker: ${TagId} at [${lat}, ${lng}]`);

			const marker = L.circleMarker([lat, lng], {
				color: '#ff0000', // 🔥 Change color for visibility
				fillColor: 'white',
				fillOpacity: 1,
				radius: 6,
				weight: 2
			}).bindPopup(`${TagId} <br> ${DateTime}`);

			marker.addTo(map); // 🔥 Ensure it's added immediately

			markers.push({ marker, id: TagId, time: new Date(DateTime) });
		});

		console.log('📍 Markers added:', markers);

		updateMarkers(); // Show initial markers
	});

	function updateMarkers() {
		if (!map) return;
		const currentTime = timestamps[selectedTime];

		console.log(`⏳ Showing markers for time: ${currentTime}`);

		// 🔥 Debug: Ensure selected time has valid markers
		const filteredMarkers = markers.filter(({ time }) => time.getTime() === currentTime.getTime());

		console.log(`🔍 Found ${filteredMarkers.length} markers for ${currentTime}`);

		// Remove all markers
		markers.forEach(({ marker }) => map?.removeLayer(marker));

		// Add only the ones matching the selected time
		filteredMarkers.forEach(({ marker }) => {
			console.log(`✅ Adding marker at: ${marker.getLatLng()}`);
			marker.addTo(map);
		});
	}
	$: {
		console.log('🔄 Individuals store updated:', $individuals);

		$individuals.forEach((ind) => {
			markers
				.filter(({ id }) => id === ind.id)
				.forEach(({ marker }) => {
					console.log(`🎨 Updating marker color for ${ind.id}: ${ind.color}`);

					map?.removeLayer(marker); // ✅ Remove the existing marker

					marker.setStyle({
						color: ind.color,
						fillColor: ind.color,
						fillOpacity: 1
					});

					marker.addTo(map); // ✅ Re-add the updated marker
				});
		});
	}
</script>

<div class="map-container">
	<Sidebar />
	<div id="map"></div>

	<!-- ✅ Time Slider UI -->
	{#if timestamps.length > 0}
		{setTimeout(() => console.log('✅ Slider should be visible!'), 500)}
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
	{:else}
		<p class="warning">⚠️ No timestamps available</p>
	{/if}
</div>

<style>
	.map-container {
		display: flex;
		position: relative;
		width: 100%;
		height: 100vh;
	}

	.sidebar {
		width: 250px;
		z-index: 1000; /* Ensure it appears above the map */
	}

	#map {
		flex: 1;
		height: 100%;
		position: relative;
		z-index: 1; /* Ensure the map stays behind */
	}

	/* ✅ Ensure the slider stays visible */
	.slider-container {
		position: absolute;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(255, 255, 255, 0.9);
		padding: 10px;
		border-radius: 10px;
		box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
		z-index: 1000; /* 🔥 Make sure it’s always on top */
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	input[type='range'] {
		width: 300px;
	}

	/* ✅ Debug: Add a border to check if it's appearing */
	.slider-container {
		border: 2px solid red; /* 🔥 Remove this later */
	}
	#map {
		flex: 1; /* Take remaining space */
		height: 100vh;
		position: relative;
		z-index: 1;
	}
</style>
