import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import string from 'vite-plugin-string';

export default defineConfig({
	plugins: [sveltekit(), string({ include: '**/*.md' })],
	// Enable source maps
	build: {
		sourcemap: true
	},
	server: {
		sourcemap: true,
		fs: {
			allow: ['.']
		}
	},
	// You may keep other asset types but .md does not need to be here with the plugin
	assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
	publicDir: 'static'
});