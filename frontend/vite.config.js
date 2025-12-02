// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   base: '/',  // Fixes asset paths on Render static sites
//   build: {
//     outDir: 'dist',
//     assetsDir: 'assets',
//     sourcemap: false,  // Speeds up deploy
//     rollupOptions: {
//       input: {
//         main: './index.html'
//       }
//     }
//   }
// })
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      input: './index.html'
    }
  },
  server: {
    headers: {
      'Cache-Control': 'no-cache'
    }
  },
  preview: {
    headers: {
      'Cache-Control': 'no-cache'
    }
  }
})
