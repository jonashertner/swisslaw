import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({ plugins: [react()], publicDir: false, resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } }, worker: { format: 'iife' }, build: { sourcemap: false } });
