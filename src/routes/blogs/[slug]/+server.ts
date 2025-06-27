// src/routes/blogs/[slug]/+server.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { json } from '@sveltejs/kit';
import matter from 'gray-matter';
import type { RequestHandler } from 'express';

export const GET: RequestHandler = async ({ params }) => {
  const { slug } = params;

  try {
    // Find the corresponding markdown file based on the slug
    const postPath = join(process.cwd(), 'static/posts', `${slug}.md`);
    const fileContents = readFileSync(postPath, 'utf8');

    // Parse front matter and markdown content
    const { data, content } = matter(fileContents);

    // Return the post data including full content
    return json({
      title: data.title,
      date: data.date,
      tags: data.tags,
      image: data.image,
      content, // Full markdown content
    });
  } catch (error) {
    console.error('Error loading blog post:', error);
    return json({ error: 'Post not found' }, { status: 404 });
  }
};