import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({mode}) => {
  return {
    plugins: [react(), tailwindcss()],
    esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {},
    define: {
      __BUILD_INFO__: JSON.stringify({
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
        shortSha: process.env.VERCEL_GIT_COMMIT_SHA ? process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7) : null,
        branch: process.env.VERCEL_GIT_COMMIT_REF || null,
        environment: process.env.VERCEL_ENV || 'local',
        source: process.env.VERCEL_GIT_COMMIT_SHA ? 'vercel' : 'local'
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
