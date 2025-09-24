// src/routes/blogs/[slug]/+server.ts
import { json } from '@sveltejs/kit';
import matter from 'gray-matter';

export const GET = async ({ params }) => {
  const { slug } = params;
  try {
    // Import all markdown files from src/posts at build time
    const modules = import.meta.glob('../../../posts/*.md', { eager: true, as: 'raw' });
    // Find the module whose filename matches the slug
    const matchingEntry = Object.entries(modules).find(([path, mod]) => path.endsWith(`${slug}.md`));
    if (!matchingEntry) {
      return json({ error: 'Post not found' }, { status: 404 });
    }
    // With 'as: raw', the value is the raw string content directly
    const rawContent = matchingEntry[1];
    const { data, content } = matter(rawContent);

    return json({
      title: data.title,
      date: data.date,
      tags: data.tags,
      image: data.image,
      content,
    });
  } catch (error) {
    console.error('Error loading blog post:', error);
    return json({ error: 'Post not found' }, { status: 404 });
  }
};
