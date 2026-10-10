import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // @personal-ecommerce/shared is a linked workspace package (not a real node_modules
  // install), so Vite serves its CommonJS dist file raw via /@fs/ instead of running it
  // through esbuild's CJS->ESM named-export conversion. Forcing it into optimizeDeps makes
  // Vite pre-bundle it like a normal dependency, so named imports (e.g. `Role`) resolve.
  optimizeDeps: {
    include: ['@personal-ecommerce/shared'],
  },
})
