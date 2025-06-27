<!-- ToDo: Use these in +page.svelte -->

<script>
  export let post;
</script>

<article>
  <h2>{post.title}</h2>
  <img src="images/{post.image}" alt={post.title} />
  <p>{post.summary}</p>
  <a href={`/blog/${post.slug}`}>Read more</a>
</article>
