import { writable } from 'svelte/store';

import type { MarkerManager } from '$lib/utils/markerManager';

export const markerManager = writable<MarkerManager | null>(null);
export const markerList = writable<{ id: string; lat: number; lng: number; time: Date }[]>(
	[],
	() => {
		console.log('🟢 markerList store initialized'); // ✅ Log store initialization
		return () => console.log('🔴 markerList store destroyed'); // Cleanup function
	}
);

// ✅ Log marker changes
markerList.subscribe((markers) => {
	//console.log(`📌 markerList updated: ${markers.length} markers`, markers);
});
