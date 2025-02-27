import { writable } from 'svelte/store';

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
		const updated = current.map((ind) => (ind.id === id ? { ...ind, ...changes } : ind));
		console.log('🔄 Individuals store updated:', updated);
		return updated;
	});
}

function getRandomColor() {
	// Ensure a 6-character hex code (e.g., #ff5733)
	return `#${Math.floor(Math.random() * 16777215)
		.toString(16)
		.padStart(6, '0')}`;
}
