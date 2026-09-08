import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: isSsrBuild
        ? {}
        : {
            // Client only. The SSR build externalises these, and Rollup rejects
            // a manual chunk for a module it is treating as external.
            manualChunks: {
              three: ['three'],
              r3f: ['@react-three/fiber', '@react-three/drei'],
              motion: ['gsap', 'lenis'],
            },
          },
    },
  },
}))
