<!-- src/routes/blogs/[slug]/+page.svelte -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores'; // Access route parameters like 'slug'
  import { marked } from 'marked'; // For parsing markdown content
  import type { Post } from '$lib/types/types';

  let post: Post = null;
  let markdownContent = '';

  // Fetch the post content when the component mounts
  onMount(async () => {
      const slug = $page.params.slug; // Get slug from URL parameters
      try {
          const response = await fetch(`/blogs/${slug}`);
          if (response.ok) {
              post = await response.json();
              markdownContent = marked(post.content); // Parse markdown content
          } else {
              console.error('Failed to fetch post:', response.statusText);
          }
      } catch (error) {
          console.error('Error fetching post:', error);
      }
  });
</script>

<main>
  {#if post}
      <article>
          <h1>{post.title}</h1>
          <p>{post.date}</p>
          <div class="markdown-content" {@html markdownContent}></div>
      </article>
  {:else}
      <p>Loading...</p>
  {/if}
</main>

<style>
  .markdown-content {
      max-width: 800px;
      margin: 0 auto;
  }
</style>
