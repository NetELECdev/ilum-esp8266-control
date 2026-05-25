export default defineNuxtConfig({
  // Forzamos la fecha de compatibilidad para que Nuxt 4 use las funciones serverless modernas
  compatibilityDate: '2026-05-25', 

  devServer: {
    port: 8080
  },

  app: {
    head: {
      title: 'Control Iluminación con ESP8266'
    }
  }
  // ELIMINAMOS por completo el bloque nitro preset manual
})