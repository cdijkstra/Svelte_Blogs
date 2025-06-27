<!-- src/routes/blogs/[slug]/+page.svelte -->

<script lang="ts">
  import SvelteMarkdown from "svelte-markdown";
  import { marked } from "marked"; // For parsing markdown content
  import type { PageData } from "./$types";
  import "./blogpost.css";

  export let data: PageData;

  $: markdownContent = marked(data.content);
</script>

<main>
  {#if data}
    <article class="markdown-content">
      <h1>{data.title}</h1>
      <p>{data.date}</p>
      <SvelteMarkdown source={markdownContent}></SvelteMarkdown>
    </article>
  {:else}
    <p>Loading...</p>
  {/if}
</main>
