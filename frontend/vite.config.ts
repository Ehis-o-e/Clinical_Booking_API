import { loadEnv, type ProxyOptions } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const serverEnvironment = loadEnv(mode, process.cwd(), '');
    const backendUrl = serverEnvironment.BACKEND_API_URL;
    const backendApiKey = serverEnvironment.BACKEND_API_KEY;

    const proxy: Record<string, ProxyOptions> = {};

    if (backendUrl && backendApiKey) {
        const forward = (backendPath: string): ProxyOptions => ({
            target: backendUrl,
            changeOrigin: true,
            rewrite: (path) => {
                const queryIndex = path.indexOf('?');
                return queryIndex === -1 ? backendPath : `${backendPath}${path.slice(queryIndex)}`;
            },
            configure: (server) => {
                server.on('proxyReq', (request) => request.setHeader('X-API-Key', backendApiKey));
            }
        });

        proxy['/api/bookings/'] = {
            target: backendUrl,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            configure: (server) => {
                server.on('proxyReq', (request) => request.setHeader('X-API-Key', backendApiKey));
            }
        };
        proxy['/api/slots'] = forward('/slots');
        proxy['/api/bookings'] = forward('/bookings');
        if (mode === 'development') {
            proxy['/api/reset'] = forward('/reset');
        }
    }

    return {
        plugins: [react(), tailwindcss()],
        server: { proxy: Object.keys(proxy).length === 0 ? undefined : proxy },
        test: {
            environment: 'jsdom',
            setupFiles: './src/test/setup.ts',
            globals: true,
            css: true
        }
    };
});
