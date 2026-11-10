import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative assets support both a local preview and /<repository>/ on Pages.
export default defineConfig({ plugins: [react()], base: './' });
