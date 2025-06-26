import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
    const { slug } = params;

    try {
        const response = await fetch(`/blogs/${slug}`);
        if (response.ok) {
            const post = await response.json();
            return post;
        } else {
            throw new Error('Post not found');
        }
    } catch (error) {
        console.error('Error loading blog post:', error);
        throw new Error('Post not found');
    }
};
