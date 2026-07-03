export default defineNuxtConfig({
  compatibilityDate: '2026-05-25',

  devServer: {
    port: 8080
  },

  app: {
    head: {
      title: 'NetELEC Control',
      link: [
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'apple-touch-icon', href: '/icon-192.png' },
        { rel: 'icon', type: 'image/png', href: '/icon-192.png' }
      ],
      meta: [
        { name: 'theme-color', content: '#00ffcc' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'application-name', content: 'NetELEC' },
        { name: 'msapplication-TileColor', content: '#00ffcc' },
        { name: 'msapplication-TileImage', content: '/icon-192.png' }
      ]
    }
  },

  nitro: {
    preset: "netlify"
  }
})