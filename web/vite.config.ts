import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import obfuscatorPlugin from 'rollup-plugin-obfuscator'

const isProd = process.env.NODE_ENV === 'production'
const obfuscate =
  isProd &&
  process.env.VITE_OBFUSCATE === '1' &&
  process.env.VITE_SKIP_OBF !== '1'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    obfuscate &&
      obfuscatorPlugin({
        // Only obfuscate app chunks; leave vendor bundles untouched (Privy/Wagmi stability).
        global: false,
        options: {
          compact: true,
          controlFlowFlattening: false,
          deadCodeInjection: false,
          debugProtection: false,
          disableConsoleOutput: false,
          identifierNamesGenerator: 'hexadecimal',
          renameGlobals: false,
          selfDefending: false,
          stringArray: true,
          stringArrayEncoding: ['base64'],
          stringArrayThreshold: 0.55,
          transformObjectKeys: false,
          unicodeEscapeSequence: false,
        },
      }),
  ].filter(Boolean),
  optimizeDeps: {
    holdUntilCrawlEnd: false,
    include: [
      '@privy-io/react-auth',
      '@privy-io/wagmi',
      '@tanstack/react-query',
      'wagmi',
      'wagmi/connectors',
      'viem',
      'viem/chains',
    ],
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: true,
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Avoid circular vendor/web3 chunks that can blank the page on GitHub Pages.
        manualChunks(id) {
          if (id.includes('@privy-io')) return 'privy'
          return undefined
        },
        chunkFileNames: 'assets/c-[hash].js',
        entryFileNames: 'assets/e-[hash].js',
        assetFileNames: 'assets/a-[hash][extname]',
      },
    },
  },
  esbuild: {
    drop: isProd ? ['debugger'] : [],
    legalComments: 'none',
  },
  server: {
    host: '0.0.0.0',
    port: 8000,
    strictPort: false,
    warmup: {
      clientFiles: ['./src/main.tsx', './src/App.tsx'],
    },
  },
})
