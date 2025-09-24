<script lang="ts">
  import "./blogs.css";

  import { onMount } from "svelte";
  import type { Post } from "$lib/types/types";

  import PixelArt from "../PixelArt.svelte";

  let posts: Post[] = [];
  // Uncomment if something broke
  // let posts = [{
  //     title:  "Mastering JMESPath queries in the Azure CLI",
  //     date: "2021-05-22 15:45:00 +0100",
  //     tags: "DevOps Azure jq jmespath",
  //     image: "jmespath.png",
  //     summary: "summary",
  //     slug: "2021-05-22-Azure-Cli-Querying-Tips.md"
  // }];

  onMount(async () => {
    console.log("Calling blog retrieval API");
    fetchPosts();
  });

  async function fetchPosts() {
    try {
      const response = await fetch("blogs");
      // Called API from server (RequestHandler)
      if (response.ok) {
        posts = await response.json();
      } else {
        console.error("Failed to fetch posts:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }

  function readMore(slug: string) {
    location.href = `/blogs/${slug}`; // Navigate to blogs/[slug]
  }
</script>

<main>
  <div class="title-flexbox">
    <h1>Congratulations 🎉 You've found my blogs</h1>
    <PixelArt />
    <p class="blogcount" data-count={posts.length}>Posts available</p>
  </div>

  <div class="post-flexbox">
    {#if posts.length > 0}
      {#each posts as post}
        <article>
          <h2 class="fancy-title">{post.title}</h2>
          <img src="/images/{post.image}" alt={post.title} />
          <p class="summary">{post.summary}</p>
          <button on:click={() => readMore(post.slug)}>Read more</button>
        </article>
      {/each}
    {:else}
      <p>Loading...</p>
    {/if}
  </div>
</main>
