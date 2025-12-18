import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      https: (() => {
        if (env.USE_HTTPS !== 'true') return undefined;
        const pfxPath = path.resolve(__dirname, 'server/certs/cert.pfx');
        if (fs.existsSync(pfxPath)) {
          return {
            pfx: fs.readFileSync(pfxPath),
            passphrase: 'password',
          };
        }
        return undefined;
      })(),
      proxy: {
        '/api': {
          target: (env.USE_HTTPS === 'true' && fs.existsSync(path.resolve(__dirname, 'server/certs/cert.pfx')))
            ? 'https://localhost:3001'
            : 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
