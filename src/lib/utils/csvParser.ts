import { toLatLon } from 'utm';

/*
 * Parse CSV data from a URL and convert UTM coordinates to Lat/Lng
 */

export async function parseCSV(
	url: string
): Promise<{ TagId: string; Name: string; DateTime: Date; lat: number; lng: number }[]> {
	// Fetch CSV file
	const response = await fetch(url);

	// Get raw CSV content
	const text = await response.text();

	//console.log('📂 Raw CSV Content:', text);

	const rows = text.trim().split('\n').slice(1); // Skip headers

	const data = rows
		.map((row, index) => {
			const cols = row.split(',').map((col) => col.trim());
			//Check if all rows are correct
			if (cols.length < 5) {
				console.warn(`⚠️ Skipping invalid row at index ${index + 1}:`, row);
				return null;
			}

			// Destructure columns
			const [_, TagId, Name, DateTime, UTMx, UTMy] = cols;

			// Convert UTM to Lat/Lng (UTM Zone 18N)
			const { latitude, longitude } = toLatLon(parseFloat(UTMx), parseFloat(UTMy), 18, 'N');

			//console.log(`🌍 Converted UTM → LatLng: ${latitude}, ${longitude}`);

			// Convert DateTime to Date object
			const parts = DateTime.match(/(\d+)\/(\d+)\/(\d+) (\d+):(\d+)/);
			if (!parts) {
				console.warn(`🚨 Invalid DateTime format: ${DateTime}`);
				return null;
			}

			const [, month, day, year, hours, minutes] = parts.map(Number);
			const parsedDate = new Date(year, month - 1, day, hours, minutes);

			if (isNaN(parsedDate.getTime())) {
				console.warn(`🚨 Invalid Date: ${DateTime}`);
				return null;
			}

			return { TagId, Name, DateTime: parsedDate, lat: latitude, lng: longitude };
		})
		.filter(
			(point): point is { TagId: string; Name: string; DateTime: Date; lat: number; lng: number } =>
				point !== null
		); // Type Predicate

	console.log('✅ Parsed Data with Lat/Lng:', data);
	return data;
}
