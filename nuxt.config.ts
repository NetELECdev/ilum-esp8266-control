export default defineNuxtConfig({
  devServer: {
    port: 8080
  },

  app: {
    head: {
      title: 'Control Iluminación con ESP8266'
    }
  },

  nitro: {
    preset: "netlify"
  }
})