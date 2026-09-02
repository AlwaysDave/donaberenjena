import fs from 'fs';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig(({mode}) => {
  let appVersion = '0.0.0-local';
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
    if (pkg.version) {
      appVersion = pkg.version;
    }
  } catch (e) {
    // Fallback if read fails
  }

  return {
    plugins: [react(), tailwindcss()],
    esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {},
    define: {
      __APP_VERSION__: JSON.stringify(`v${appVersion}`),
      __BUILD_INFO__: JSON.stringify({
        environment: process.env.VERCEL_ENV || 'local',
        buildDate: new Date().toISOString(),
      })
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
