<script lang="ts">
	import { onMount } from "svelte";

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null;

	let width = 300;
	let height = 60;
	const pixelSize = 10;

	const colors: string[] = [
		"#ff3e00",
		"#ffdd00",
		"#00ff99",
		"#0099ff",
		"#ff33cc"
	];

	let pixels: string[][] = [];

	const randomColor = (): string =>
		colors[Math.floor(Math.random() * colors.length)];

	const initPixels = (): void => {
		pixels = [];
		const cols = Math.floor(width / pixelSize);
		const rows = Math.floor(height / pixelSize);

		for (let y = 0; y < rows; y++) {
			const row: string[] = [];
			for (let x = 0; x < cols; x++) {
				row.push(randomColor());
			}
			pixels.push(row);
		}
	};

	const draw = (): void => {
		if (!ctx) return;
		const cols = Math.floor(width / pixelSize);
		const rows = Math.floor(height / pixelSize);

		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				ctx.fillStyle = pixels[y]?.[x] ?? randomColor();
				ctx.fillRect(
					x * pixelSize,
					y * pixelSize,
					pixelSize,
					pixelSize
				);
			}
		}
	};

	const update = (): void => {
		const cols = Math.floor(width / pixelSize);
		const rows = Math.floor(height / pixelSize);

		for (let i = 0; i < 5; i++) {
			const x = Math.floor(Math.random() * cols);
			const y = Math.floor(Math.random() * rows);
			pixels[y][x] = randomColor();
		}
	};

	const animate = (): void => {
		draw();
		update();
		requestAnimationFrame(animate);
	};

	// 👇 NEW: Extend grid size dynamically when dragging
	let isDragging = false;
	let startX = 0;
	let startY = 0;

	const onMouseDown = (e: MouseEvent) => {
		isDragging = true;
		startX = e.clientX;
		startY = e.clientY;
	};

	const onMouseUp = () => {
		isDragging = false;
	};

	const onMouseMove = (e: MouseEvent) => {
		if (!isDragging) return;

		const dx = e.clientX - startX;
		const dy = e.clientY - startY;

		// increase canvas size as you drag diagonally
		if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
			width = Math.max(50, width + dx);
			height = Math.max(50, height + dy);
			canvas.width = width;
			canvas.height = height;

			extendPixels();
			startX = e.clientX;
			startY = e.clientY;
		}
	};

	// 👇 Function to extend pixel grid instead of resetting it
	const extendPixels = () => {
		const newCols = Math.floor(width / pixelSize);
		const newRows = Math.floor(height / pixelSize);

		// add new rows if necessary
		while (pixels.length < newRows) {
			const row: string[] = [];
			for (let x = 0; x < newCols; x++) {
				row.push(randomColor());
			}
			pixels.push(row);
		}

		// extend each existing row with new columns
		for (let y = 0; y < newRows; y++) {
			while (pixels[y].length < newCols) {
				pixels[y].push(randomColor());
			}
		}
	};

	onMount(() => {
		ctx = canvas.getContext("2d");
		if (!ctx) return;
		initPixels();
		animate();
	});
</script>

<canvas
	bind:this={canvas}
	{width}
	{height}
	style="border-radius:12px; background:#efc690; display:block; margin:2rem auto; cursor: nwse-resize;"
	on:mousedown={onMouseDown}
	on:mouseup={onMouseUp}
	on:mouseleave={onMouseUp}
	on:mousemove={onMouseMove}
/>
