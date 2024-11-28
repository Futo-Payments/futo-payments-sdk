import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// @ts-ignore - Ignoring type issues with the nodePolyfills plugin
export default defineConfig({
    plugins: [
        react(),
        nodePolyfills({
            include: ['buffer'],
            globals: {
                Buffer: true,
                global: true,
                process: true
            },
            protocolImports: true
        })
    ],
    server: {
        port: 3000
    },
    define: {
        'window.env': {
            VITE_TON_PAYMENTS_API_URL: process.env.VITE_TON_PAYMENTS_API_URL
        }
    }
}); 