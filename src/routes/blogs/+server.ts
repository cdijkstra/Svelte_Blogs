import { json } from '@sveltejs/kit';
import matter from 'gray-matter';
import type { Post } from '$lib/types/types';

// Retrieves basic information about all blog posts that are located in src/posts
export const GET = async () => {
    try {
        // Import all markdown files from src/posts at build time
        const modules = import.meta.glob('../../posts/*.md', { eager: true, as: 'raw' });
        const posts: Post[] = Object.entries(modules).map(([path, rawContent]: any) => {
            // With 'as: raw', the module IS the string content directly
            const { data, content } = matter(rawContent);
            console.log("Found data", data);
            // Extract summary: find first paragraph after any ## header
            const extractSummary = (content: string): string => {
                const lines = content.split('\n');
                let foundHeader = false;
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line.startsWith('##')) {
                        foundHeader = true;
                        continue;
                    }
                    if (foundHeader && line.length > 0) {
                        return line;
                    }
                }
                return lines.find(line => line.trim().length > 0) || 'No summary available';
            };
            // derive slug from filename
            const slug = path.split('/').pop()?.replace('.md', '') || '';
            return {
                title: data.title,
                date: data.date,
                tags: data.tags,
                image: data.image,
                summary: extractSummary(content),
                slug,
            };
        });
        return json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};
