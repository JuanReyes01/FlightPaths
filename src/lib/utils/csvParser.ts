import Papa from 'papaparse';
import proj4 from 'proj4';

const utm18N = '+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs';
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';

/**
 * Converts UTM (X, Y) to Latitude/Longitude
 */
export function utmToLatLng(utmX: number, utmY: number): { lat: number; lng: number } {
	const [lng, lat] = proj4(utm18N, wgs84, [utmX, utmY]);
	return { lat, lng };
}

/**
 * Parses a CSV file and converts UTM to Lat/Lng.
 */
export async function parseCSV(filePath: string) {
	const response = await fetch(filePath);
	const text = await response.text();

	return new Promise<{ lat: number; lng: number; tagId: string; name: string; time: string }[]>(
		(resolve) => {
			Papa.parse(text, {
				header: true,
				skipEmptyLines: true,
				complete: (results) => {
					const data = results.data.map((row: any) => {
						const { lat, lng } = utmToLatLng(parseFloat(row.UTMx), parseFloat(row.UTMy));
						return {
							tagId: row.TagId,
							name: row.Name,
							time: row.DateTime, // Keep as string
							lat,
							lng
						};
					});
					resolve(data);
				}
			});
		}
	);
}
