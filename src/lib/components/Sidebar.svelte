<script lang="ts">
	import { individuals, updateIndividual } from '$lib/stores/IndividualStore';

	function changeColor(id: string, event: Event) {
		let color = (event.target as HTMLInputElement).value;

		// Ensure color is a valid 6-character hex code
		if (!/^#[0-9A-F]{6}$/i.test(color)) {
			console.warn(`🚨 Invalid color detected: ${color}`);
			return;
		}

		console.log(`🎨 Sidebar color change for ${id}: ${color}`);
		updateIndividual(id, { color });
	}
</script>

<aside class="sidebar">
	<h2>Tracked Individuals</h2>
	<ul>
		{#each $individuals as individual}
			<li>
				<span>{individual.name}</span>
				<input
					type="color"
					bind:value={individual.color}
					on:input={(e) => changeColor(individual.id, e)}
				/>
				<button on:click={() => updateIndividual(individual.id, { visible: !individual.visible })}>
					{individual.visible ? 'Show' : 'Hide'}
				</button>
			</li>
		{/each}
	</ul>
</aside>

<style>
	.sidebar {
		position: absolute;
		top: 0;
		left: 0;
		width: 250px;
		height: 100vh;
		background: white;
		box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
		padding: 1rem;
		overflow-y: auto;
		z-index: 1000; /* ✅ Ensure it's above the map */
	}
</style>
