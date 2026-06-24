import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** VITE_APP_BASE_PATH: /theurbanphysio (local) or empty (live public_html root) */
function viteBaseFromEnv(env) {
  const raw = (env.VITE_APP_BASE_PATH ?? '/theurbanphysio').trim()
  if (raw === '' || raw === '/') {
    return '/'
  }
  return `/${raw.replace(/^\/+|\/+$/g, '')}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = viteBaseFromEnv(env)
  const baseNoSlash = base.replace(/\/$/, '') || ''
  const apiProxyPath = `${baseNoSlash}/backend/api`

  return {
    base,
    build: {
      // New folder name — bypasses Cloudflare edge cache that wrongly tagged /assets/*.css as JS
      assetsDir: 'static',
    },
    plugins: [
      react(),
      {
        name: 'html-css-before-js',
        transformIndexHtml(html) {
          return html.replace(
            /(<script type="module" crossorigin src="[^"]+"><\/script>\s*)(<link rel="stylesheet" crossorigin href="[^"]+">)/,
            '$2\n    $1',
          )
        },
      },
      // Cloudflare Pages ignores .htaccess — keep it out of dist to avoid confusion
      {
        name: 'cloudflare-dist-cleanup',
        closeBundle() {
          const distDir = path.resolve(__dirname, 'dist')
          const htaccess = path.join(distDir, '.htaccess')
          if (fs.existsSync(htaccess)) {
            fs.copyFileSync(htaccess, path.join(distDir, 'htaccess-hostinger.txt'))
            fs.unlinkSync(htaccess)
          }
        },
      },
    ],
    server: {
      port: 5173,
      proxy: {
        [apiProxyPath]: {
          target: 'http://localhost',
          changeOrigin: true,
        },
      },
    },
  }
})
