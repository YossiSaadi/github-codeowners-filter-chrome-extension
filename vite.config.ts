import { defineConfig } from 'vite';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  build: {
    rollupOptions: {
      input: 'src/index.ts',
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
      },
    },
    outDir: 'dist',
    // emptyOutDir: true,
  },
  plugins: [
    copy({
      targets: [
        { src: 'manifest.json', dest: 'dist' },
        { src: 'README.md', dest: 'dist' },
        { src: 'privacy.md', dest: 'dist' },
      ],
      hook: 'writeBundle',
    }),
  ],
});
