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
            
            // Extract summary: find first paragraph after any ## header
            const extractSummary = (content: string): string => {
                const lines = content.split('\n');
                let foundHeader = false;
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    
                    // Check if this line is a ## header
                    if (line.startsWith('##')) {
                        foundHeader = true;
                        continue;
                    }
                    
                    // If we found a header and this line has content (not empty)
                    if (foundHeader && line.length > 0) {
                        return line;
                    }
                }
                
                // Fallback: return first non-empty line if no ## header found
                return lines.find(line => line.trim().length > 0) || 'No summary available';
            };
            
            return {
                title: data.title,
                date: data.date,
                tags: data.tags,
                image: data.image,
                summary: extractSummary(content),
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