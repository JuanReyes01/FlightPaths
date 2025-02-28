import { writable } from 'svelte/store';
import type { Map } from 'leaflet';

export const map = writable<Map | null>(null);
