import { toLatLon } from 'utm';

export async function parseCSV(url: string) {
	const response = await fetch(url);
	const text = await response.text();

	console.log('📂 Raw CSV Content:', text);

	const rows = text.trim().split('\n').slice(1); // Skip headers
	const data = rows
		.map((row, index) => {
			const cols = row.split(',').map((col) => col.trim());
			if (cols.length < 5) {
				console.warn(`⚠️ Skipping invalid row at index ${index + 1}:`, row);
				return null;
			}

			const [_, TagId, Name, DateTime, UTMx, UTMy] = cols;

			// Convert UTM to Lat/Lng (UTM Zone 18N)
			const { latitude, longitude } = toLatLon(parseFloat(UTMx), parseFloat(UTMy), 18, 'N');

			//console.log(`🌍 Converted UTM → LatLng: ${latitude}, ${longitude}`);

			return { TagId, Name, DateTime, lat: latitude, lng: longitude };
		})
		.filter(Boolean); // Remove null values

	console.log('✅ Parsed Data with Lat/Lng:', data);
	return data;
}
