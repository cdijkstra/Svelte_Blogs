<!-- <script context="module" lang="ts">
    import { marked } from 'marked';
  
    export async function load() {
      const response = await fetch(`/src/routes/blogs/posts/2021-05-22-Azure-Cli-Querying-Tips.md`); // Adjust the path to your Markdown files
      if (response.ok) {
        const markdownText = await response.text();
        const [metadata, content] = markdownText.split('---').slice(1);
        const frontMatter = metadata.trim().split('\n').reduce((acc, line) => {
          const [key, value] = line.split(': ');
          acc[key.trim()] = value.trim();
          return acc;
        }, {});
        const htmlContent = marked(content.trim());
        return {
          props: {
            frontMatter,
            htmlContent
          }
        };
      } else {
        console.error('Failed to fetch blog post:', response.statusText);
        return { status: response.status, error: new Error(response.statusText) };
      }
    }
  </script>
  
  <script lang="ts">
    export let frontMatter;
    export let htmlContent;
  </script>
  
  <main>
    <h1>{frontMatter.title}</h1>
    <p>{frontMatter.date}</p>
    <div innerHTML={htmlContent}></div>
  </main>
  
  <style>
    main {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }
  </style>
   -->