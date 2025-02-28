<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { map } from '$lib/stores/MapStore';
	import { markerManager } from '$lib/stores/MarkerStore';
	import { MarkerManager, type MarkerData } from '$lib/utils/markerManager';
	import { parseCSV } from '$lib/utils/csvParser';
	import { individuals, setIndividuals } from '$lib/stores/IndividualStore';
	import Map from '$lib/components/Map.svelte';
	import type { Map as LeafletMap } from 'leaflet';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let mapInstance: LeafletMap | null = null;
	let markers: MarkerData[] = [];
	let points: { TagId: string; Name: string; DateTime: Date; lat: number; lng: number }[] = [];
	let timestamps: Date[] = [];
	let selectedTime: number = 0; // Index in timestamps array
	let manager: any = null;

	// Subscribe to the map store and initialize markerManager when available
	$: if (mapInstance && !get(markerManager)) {
		console.log('🛠 Initializing markerManager...');
		const manager = new MarkerManager(mapInstance);
		markerManager.set(manager);
		console.log('✅ markerManager initialized:', get(markerManager));

		// Add markers if they were already loaded
		if (markers.length > 0) {
			//console.log('📍 Adding markers...');
			manager.addMarkers(markers);
		}
	}

	// ✅ Ensures async function doesn't break onMount's return type
	onMount(() => {
		// Subscribe to map store
		const unsubscribe = map.subscribe((m: LeafletMap | null) => {
			if (m) {
				console.log('✅ Map is ready, initializing markerManager');
				mapInstance = m;
			}
		});

		// Load markers asynchronously (runs separately)
		loadMarkers();

		// Cleanup on unmount
		return unsubscribe;
	});

	// ✅ Separate async function for loading markers
	async function loadMarkers() {
		try {
			console.log('📂 Fetching and parsing CSV data...');
			points = await parseCSV('/data/allBirds_Winter2023_Radio-tracking_A-nigricollis.csv');
			console.log('✅ Parsed markers:', markers);

			// Sort timestamps and store unique values
			timestamps = [...new Set(points.map((p) => new Date(p.DateTime)))].sort(
				(a, b) => a.getTime() - b.getTime()
			);

			// Add individuals from CSV
			setIndividuals(points);

			// Convert CSV data to MarkerData
			markers = points.map((point) => ({
				id: point.TagId,
				lat: point.lat,
				lng: point.lng,
				time: point.DateTime,
				//Get color from individual
				color: get(individuals).find((i) => i.id === point.TagId)?.color
			}));

			// If markerManager is already initialized, add markers
			manager = get(markerManager);
			if (manager) {
				console.log('📍 Adding markers...');
				manager.addMarkers(markers);
			}
			manager?.updateMarkers(timestamps[selectedTime]);
		} catch (error) {
			console.error('❌ Error loading CSV data:', error);
		}
	}
</script>

<main>
	<h1>📍 Map Page</h1>

	<!-- ✅ Ensures Map is properly mounted -->
	<Map />
	<Sidebar />
	{#if $map}
		<p style="color: green">✅ Map is ready!</p>
	{:else}
		<p style="color: red">❌ Waiting for map...</p>
	{/if}

	{#if markers.length > 0}
		<p>📌 Loaded {markers.length} markers</p>
	{/if}
	<!-- Time Slider UI -->
	{#if timestamps.length > 0}
		<div class="slider-container">
			<input
				type="range"
				min="0"
				max={timestamps.length - 1}
				bind:value={selectedTime}
				on:input={() => manager?.updateMarkers(timestamps[selectedTime])}
			/>
			<p>{timestamps[selectedTime].toLocaleString()}</p>
		</div>
	{/if}

	<button on:click={() => get(markerManager)?.addMarkers(markers)}>Reload Markers</button>
</main>

<style>
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
