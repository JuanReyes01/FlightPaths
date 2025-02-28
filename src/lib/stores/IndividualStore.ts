import { get, writable } from 'svelte/store';
import { markerManager } from '$lib/stores/MarkerStore'; // ✅ Correct import

export type Individual = {
	id: string;
	name: string;
	color: string;
	visible: boolean;
};

export const individuals = writable<Individual[]>([]);

export function setIndividuals(data: { TagId: string; Name: string }[]) {
	const uniqueIndividuals = Array.from(
		new Map(
			data.map((d) => [
				d.TagId,
				{
					id: d.TagId,
					name: d.Name,
					color: getRandomColor(),
					visible: true
				}
			])
		).values()
	);

	console.log('📌 Individuals loaded into store:', uniqueIndividuals);
	individuals.set(uniqueIndividuals);
}

export function updateIndividual(id: string, changes: Partial<Individual>) {
	individuals.update((current) => {
		const updated = current.map((ind) => {
			if (ind.id === id) {
				return { ...ind, ...changes };
			}
			return ind;
		});
		console.log('🔄 Individuals store updated:', updated);

		const manager = get(markerManager);
		if (manager) {
			if (changes.color) manager.updateMarkerColor(id, changes.color); // Update marker color
			manager.reRenderMarkers(); // Refresh markers
		}

		return updated;
	});
}

export function getIndividualColor(id: string): string {
	const individual = get(individuals).find((ind) => ind.id === id);
	return individual ? individual.color : '';
}

function getRandomColor() {
	return `#${Math.floor(Math.random() * 16777215)
		.toString(16)
		.padStart(6, '0')}`;
}
