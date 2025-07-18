import { defineConfig } from 'vite';

// If using React, also import react from '@vitejs/plugin-react';
// import react from '@vitejs/plugin-react';

// Set the base path for GitHub Pages deployment
export default defineConfig({
  // plugins: [react()], // Uncomment if using React
  base: '/haiiloplugin/', // <--- THIS IS THE CRUCIAL LINE
  build: {
    outDir: 'dist'
  }
});
