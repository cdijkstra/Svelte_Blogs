import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { json } from '@sveltejs/kit';
import matter from 'gray-matter';
import type { Post } from '$lib/types/types'
import type { RequestHandler } from 'express';

// Retrieves basic information about all blog posts that are located in src/posts
export const GET: RequestHandler = async () => {
    try {
        const postsDirectory = join(process.cwd(), 'src/posts');
        const filenames = readdirSync(postsDirectory);

        const posts: Post[] = filenames.map((filename) => {
            const filePath = join(postsDirectory, filename);
            const fileContents = readFileSync(filePath, 'utf8');
            const { data, content } = matter(fileContents);
            // Use gray-matter to filter metadata and content
            return {
                title: data.title,
                date: data.date,
                tags: data.tags,
                image: data.image,
                summary: content.split('\n')[2], // Assuming the first line of content is the summary
                slug: filename.replace('.md', '') // Slug value is used in /blogs/[slug]
            };
        });
        return json(posts);
        // ToDo: Find a better way to display a summary!

    } catch (error) {
        console.error('Error fetching posts:', error);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};