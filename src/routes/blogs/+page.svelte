<script>
	import './blogs.css';

    import { onMount } from 'svelte';
    import marked from 'marked';
    import matter from 'gray-matter';
    import { navigate } from 'svelte-routing';

  
    let posts = [{
        title:  "Mastering JMESPath queries in the Azure CLI",
        date: "2021-05-22 15:45:00 +0100",
        tags: "DevOps Azure jq jmespath",
        image: "jmespath.png",
        summary: "summary",
        slug: "2021-05-22-Azure-Cli-Querying-Tips.md"
    }];
  
    // function readMore(slug: string) {
    //     navigate(`/src/blogs/${slug}`);
    // }

    // onMount(async () => {
    //   const postFiles = import.meta.glob('/src/posts/*.md');
  
    // });
  </script>
  
  <main>
    <h1>Here you can find my blogs</h1>
    <p>Blog count: {posts.length}</p>
  
    {#if posts.length > 0}
      {#each posts as post}
        <article>
          <h2>{post.title}</h2>
          <img src="/src/lib/images/{post.image}" alt={post.title} />
          <p>{post.summary}</p>
          <!-- <button on:click={() => readMore(post.slug)}>Read more</button> -->
        </article>
      {/each}
    {:else}
      <p>Loading...</p>
    {/if}
  </main>
  