<script lang="ts" context="module">
    import { marked } from 'marked';
    import { onMount } from 'svelte';

    onMount(() => {
        console.log("Component mounted");
    });

    export async function load({ params }: { params: { slug: string } }) {
      const { slug } = params;
      console.log("Hi")
  
      try {
        const response = await fetch(`/src/posts/${slug}.md`);
        if (!response.ok) {
          return {
            status: 404,
            error: new Error('Post not found')
          };
        }
  
        const markdown = await response.text();
        const html = marked(markdown);
        const titleMatch = markdown.match(/^# (.+)$/m);
        const title = titleMatch ? titleMatch[1] : 'Untitled Post';
  
        return {
          props: {
            html,
            title
          }
        };
      } catch (error) {
        return {
          status: 500,
          error: new Error('Failed to load the post')
        };
      }
    }
</script>

<script lang="ts">
import type { log } from "console";

export let html: string;
export let title: string;
</script>

<main>
<article>
    <h1>{title}</h1>
    <!-- <div class="markdown-content" {@html html}></div> -->
</article>
</main>

<style>
.markdown-content h1, .markdown-content h2, .markdown-content h3 {
    margin-top: 1em;
}
.markdown-content p {
    margin-bottom: 1em;
}
/* Additional styling for the rendered markdown */
</style>
  