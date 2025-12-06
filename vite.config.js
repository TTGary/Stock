import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  build: {
    outDir: 'docs'
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/sina': {
        target: 'https://hq.sinajs.cn',
        changeOrigin: true,
        rewrite: (path) => {
          // 处理 /api/sina?url=list=xxx 格式
          const match = path.match(/\/api\/sina\?url=(.+)/)
          return match ? match[1] : path.replace(/^\/api\/sina/, '')
        },
        headers: {
          'Referer': 'https://finance.sina.com.cn'
        }
      },
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => {
          // 处理 /api/yahoo?url=xxx 格式
          const match = path.match(/\/api\/yahoo\?url=(.+)/)
          return match ? match[1] : path.replace(/^\/api\/yahoo/, '')
        }
      },
      '/api/eastmoney': {
        target: 'https://push2.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => {
          // 处理 /api/eastmoney?url=xxx 格式
          const match = path.match(/\/api\/eastmoney\?url=(.+)/)
          return match ? match[1] : path.replace(/^\/api\/eastmoney/, '')
        },
        headers: {
          'Referer': 'https://quote.eastmoney.com'
        }
      }
    }
  }
})

