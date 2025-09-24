<script lang="ts">
    import { onMount } from "svelte";

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    const width = 600;
    const height = 300;
    const pixelSize = 10;

    const colors: string[] = [
        "#ff3e00",
        "#ffdd00",
        "#00ff99",
        "#0099ff",
        "#ff33cc",
    ];

    let pixels: string[][] = [];

    // Pick a random color from the palette
    const randomColor = (): string =>
        colors[Math.floor(Math.random() * colors.length)];

    // Initialize pixel grid
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

    // Draw pixel grid
    const draw = (): void => {
        if (!ctx) return;
        const cols = Math.floor(width / pixelSize);
        const rows = Math.floor(height / pixelSize);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                ctx.fillStyle = pixels[y][x];
                ctx.fillRect(
                    x * pixelSize,
                    y * pixelSize,
                    pixelSize,
                    pixelSize,
                );
            }
        }
    };

    // Update random pixels to animate
    const update = (): void => {
        const cols = Math.floor(width / pixelSize);
        const rows = Math.floor(height / pixelSize);

        for (let i = 0; i < 5; i++) {
            // animate 5 pixels per frame
            const x = Math.floor(Math.random() * cols);
            const y = Math.floor(Math.random() * rows);
            pixels[y][x] = randomColor();
        }
    };

    // Animation loop
    const animate = (): void => {
        draw();
        update();
        requestAnimationFrame(animate);
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
    style="border-radius:12px; background:#efc690; display:block; margin:2rem auto;"
></canvas>
