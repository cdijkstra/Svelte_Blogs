<script>
	import Header from './Header.svelte';
	import './styles.css';
</script>

<div class="app">
	<Header />

	<main>
		<slot />
	</main>

	<footer>
		<p>Casper Dijkstra
		<a href="https://github.com/cdijkstra"><img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Logo" style="width: 20px; height: 20px; vertical-align: middle;"></a>
		<a href="https://www.linkedin.com/in/casper-dijkstra-30661897/"><img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn Logo" style="width: 20px; height: 20px; vertical-align: middle;"></a>
		</p>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	footer p {
		margin: 0;
		font-family: 'Fraunces Variable', serif;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
