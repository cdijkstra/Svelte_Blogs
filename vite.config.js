import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	
	// Enable source maps
	build: {
	  sourcemap: true
	},
  
	// Optional: Enable source maps for the dev server as well
	server: {
	  sourcemap: true,
	  fs: {
	    allow: ['.']
	  }
	},
	
	// Configure static asset serving
	assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
	
	// Configure public directory behavior
	publicDir: 'static'
  });
