<!-- src/routes/blogs/[slug]/+page.svelte -->

<script lang="ts">
  import SvelteMarkdown from "svelte-markdown";
  import { marked } from "marked"; // For parsing markdown content
  import type { PageData } from "./$types";
  import "./blogpost.css";
  import { onMount } from "svelte";

  export let data: PageData;

  $: markdownContent = marked(data.content);

  onMount(async () => {
    // Dynamically import Prism.js for syntax highlighting
    const Prism = await import("prismjs");

    // Import language-specific modules
    // @ts-ignore - Prism.js components don't have TypeScript declarations
    await import("prismjs/components/prism-yaml");
    // @ts-ignore
    await import("prismjs/components/prism-json");
    // @ts-ignore
    await import("prismjs/components/prism-bash");
    // @ts-ignore
    await import("prismjs/components/prism-powershell");
    // @ts-ignore
    await import("prismjs/components/prism-javascript");
    // @ts-ignore
    await import("prismjs/components/prism-typescript");
    // @ts-ignore
    await import("prismjs/components/prism-css");

    // Highlight all code blocks
    Prism.highlightAll();
  });
</script>

<main>
  {#if data}
    <article class="markdown-content">
      <h1>{data.title}</h1>
      <SvelteMarkdown source={markdownContent}></SvelteMarkdown>
      <p>Date: {data.date}</p>
    </article>
  {:else}
    <p>Loading...</p>
  {/if}
</main>
