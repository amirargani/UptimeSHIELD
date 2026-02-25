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
        const configPath = path.resolve(__dirname, 'server/config.json');
        let certPass = 'password';
        if (fs.existsSync(configPath)) {
          try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (config.certPassword) certPass = config.certPassword;
          } catch (e) {
            console.warn('Vite: Failed to parse config.json for HTTPS passphrase');
          }
        }

        const pfxPath = path.resolve(__dirname, 'server/certs/cert.pfx');
        if (fs.existsSync(pfxPath)) {
          return {
            pfx: fs.readFileSync(pfxPath),
            passphrase: certPass,
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
