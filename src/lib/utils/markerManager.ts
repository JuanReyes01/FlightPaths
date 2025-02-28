import type { Map, CircleMarker } from 'leaflet'; // ✅ Import only types (doesn't affect SSR)
import { get } from 'svelte/store';
import { individuals } from '$lib/stores/IndividualStore';
import { markerList } from '$lib/stores/MarkerStore';

let L: any; // ✅ Store Leaflet instance
let currentTime = new Date();
async function loadLeaflet() {
	if (typeof window === 'undefined') return null; // Prevent SSR errors
	if (!L) {
		L = await import('leaflet');
	}
	return L;
}

export interface MarkerData {
	id: string;
	lat: number;
	lng: number;
	time: Date;
	color?: string;
}

export class MarkerManager {
	private readonly map: Map;
	private readonly markers: { marker: CircleMarker; id: string; time: Date }[] = [];

	constructor(map: Map) {
		this.map = map;
	}

	async addMarkers(points: MarkerData[]) {
		//console.log('addMarkers function called with points:', points);

		// ✅ Ensure Leaflet is loaded before proceeding
		const L = await loadLeaflet();
		if (!L) {
			console.warn('⚠️ Leaflet not loaded, cannot add markers!');
			return;
		}

		points.forEach(({ id, lat, lng, time, color = '#ff0000' }) => {
			// ✅ Validate data before adding the marker
			if (!id || isNaN(lat) || isNaN(lng)) {
				console.error(`❌ Skipping invalid marker data:`, { id, lat, lng });
				return;
			}

			const marker = L.circleMarker([lat, lng], {
				color,
				fillColor: 'white',
				fillOpacity: 1,
				radius: 6,
				weight: 2
			}).bindPopup(`${id} <br> ${time}`);
			this.markers.push({ marker, id, time });
		});
		this.syncStore();
	}

	async updateMarkers(selectedTime: Date) {
		const L = await loadLeaflet();
		if (!L) return;

		this.clearMarkers();

		currentTime = selectedTime;
		const activeIndividuals = get(individuals).filter((ind) => ind.visible);
		const activeIDs = new Set(activeIndividuals.map((ind) => ind.id));

		const filteredMarkers = this.markers.filter(
			({ time, id }) => time.getTime() === selectedTime.getTime() && activeIDs.has(id)
		);

		filteredMarkers.forEach(({ marker }) => {
			marker.addTo(this.map);
		});

		this.syncStore();
	}

	async reRenderMarkers() {
		this.updateMarkers(currentTime);
	}

	updateMarkerColor(id: string, color: string) {
		const marker = this.markers.find((m) => m.id === id);
		if (marker) {
			marker.marker.setStyle({ color });
		}
	}

	clearMarkers() {
		this.markers.forEach(({ marker }) => marker.remove());
	}

	private syncStore() {
		const markersArray = this.markers.map(({ id, marker, time }) => ({
			id,
			lat: marker.getLatLng().lat,
			lng: marker.getLatLng().lng,
			time
		}));

		markerList.set(markersArray);
	}
}
