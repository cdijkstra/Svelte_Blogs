import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { json } from '@sveltejs/kit';
import matter from 'gray-matter';
import type { Post } from '$lib/types/types'
import type { RequestHandler } from 'express';

export const GET: RequestHandler = async () => {
    try {
        const postsDirectory = join(process.cwd(), 'src/posts');
        const filenames = readdirSync(postsDirectory);

        const posts: Post[] = filenames.map((filename) => {
            const filePath = join(postsDirectory, filename);
            const fileContents = readFileSync(filePath, 'utf8');

            const { data, content } = matter(fileContents);
			console.log(content);
            const post: Post = {
                title: data.title,
                date: data.date,
                tags: data.tags,
                image: data.image,
                summary: content.split('\n')[1], // Assuming the first line of content is the summary
                slug: filename.replace('.md', '')
            };

            return post;
        });
        return json(posts);

    } catch (error) {
        console.error('Error fetching posts:', error);
        return {
            status: 500,
            body: {
                error: 'Internal Server Error'
            }
        };
    }
};