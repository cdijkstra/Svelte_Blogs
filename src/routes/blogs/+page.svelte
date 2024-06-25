<script lang="ts">
	import './blogs.css';

    import { onMount } from 'svelte';
    import { marked } from 'marked';
    import { navigate } from 'svelte-routing';

    $: markdownContent = '';
  
    let posts = [{
        title:  "Mastering JMESPath queries in the Azure CLI",
        date: "2021-05-22 15:45:00 +0100",
        tags: "DevOps Azure jq jmespath",
        image: "jmespath.png",
        summary: "summary",
        slug: "2021-05-22-Azure-Cli-Querying-Tips.md"
    },
    {
        title:  "Mastering JMESPath queries in the Azure CLI",
        date: "2021-05-22 15:45:00 +0100",
        tags: "DevOps Azure jq jmespath",
        image: "jmespath.png",
        summary: "summary",
        slug: "2021-05-22-Azure-Cli-Querying-Tips.md"
    },
    {
        title:  "Looping over complex objects in Azure Pipelines",
        date: '2022-07-03 15:45:00 +0100',
        tags: "DevOps Pipelines",
        image: "pipelines.png",
        summary: "summary",
        slug: "2021-05-22-Azure-Cli-Querying-Tips.md"
    },
    {
        title:  "Looping over complex objects in Azure Pipelines",
        date: '2022-07-03 15:45:00 +0100',
        tags: "DevOps Pipelines",
        image: "pipelines.png",
        summary: "summary",
        slug: "2021-05-22-Azure-Cli-Querying-Tips.md"
    }];
  
    // function readMore(slug: string) {
    //     navigate(`/src/blogs/${slug}`);
    // }

    // onMount(async () => {
    //     try {
    //         const response = await fetch(`/src/routes/blogs/posts/2021-05-22-Azure-Cli-Querying-Tips.md`); // Adjust the path to your Markdown files
    //         if (response.ok) {
    //             const markdownText = await response.text();
    //             const [metadata, content] = markdownText.split('---').slice(1);
    //             markdownContent = await marked.parse(content);
    //             console.log('hi');
    //         } else {
    //             console.error('Failed to fetch blog post:', response.statusText);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching blog post:', error);
    //     }
    // });

  </script>
  
  <main>
    <h1>Here you can find my blogs</h1>
    <p>Blog count: {posts.length}</p>
  
    <!-- <div class="markdown-content">{@html markdownContent}</div> -->

    {#if posts.length > 0}
        <div class="post-flexbox">
            {#each posts as post}
                <article>
                    <h2>{post.title}</h2>
                    <img src="/src/lib/images/{post.image}" alt={post.title} />
                    <p>{post.summary}</p>
                    <!-- <button on:click={() => readMore(post.slug)}>Read more</button> -->
                </article>
            {/each}
        </div>
    {:else}
      <p>Loading...</p>
    {/if}
  </main>
  