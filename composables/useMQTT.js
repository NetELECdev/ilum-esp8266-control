import mqtt from 'mqtt'
import { ref } from 'vue'

export const useMQTT = () => {
  const client = ref(null)
  const isConnected = ref(false)
  const temperatura = ref('--')
  const humedad = ref('--')
  const estadoESP = ref('OFFLINE')
  
  // ✅ BROKER PÚBLICO - SIN AUTENTICACIÓN
  const BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt'
  
  // ✅ Sin username, sin password
  const OPTIONS = {
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    keepalive: 60,
    protocol: 'wss'
  }
  
  const TOPICS = {
    TEMPERATURA: 'casa/temperatura',
    HUMEDAD: 'casa/humedad',
    ESTADO: 'casa/estado',
    LED_D5: 'casa/D5',
    LED_D6: 'casa/D6',
    LED_D7: 'casa/D7',
    LED_D8: 'casa/D8'
  }
  
  const connect = () => {
    console.log('🔌 Conectando a broker público HiveMQ...')
    
    client.value = mqtt.connect(BROKER_URL, OPTIONS)
    
    client.value.on('connect', () => {
      console.log('✅ Conectado a HiveMQ Público')
      isConnected.value = true
      estadoESP.value = 'ESP ONLINE'
      
      client.value.subscribe(TOPICS.TEMPERATURA)
      client.value.subscribe(TOPICS.HUMEDAD)
      client.value.subscribe(TOPICS.ESTADO)
    })
    
    client.value.on('message', (topic, message) => {
      const payload = message.toString()
      console.log(`📨 Mensaje recibido: ${topic} = ${payload}`)
      
      if (topic === TOPICS.TEMPERATURA) temperatura.value = payload
      if (topic === TOPICS.HUMEDAD) humedad.value = payload
      if (topic === TOPICS.ESTADO) estadoESP.value = payload
    })
    
    client.value.on('error', (err) => {
      console.error('❌ Error MQTT:', err)
      isConnected.value = false
    })
    
    client.value.on('close', () => {
      console.log('🔌 Conexión MQTT cerrada')
      isConnected.value = false
      estadoESP.value = 'OFFLINE'
    })
    
    client.value.on('reconnect', () => {
      console.log('🔄 Reintentando conexión MQTT...')
    })
  }
  
  const publish = (topic, message) => {
    if (client.value && isConnected.value) {
      client.value.publish(topic, message)
      console.log(`📤 Publicado: ${topic} = ${message}`)
    } else {
      console.warn(`⚠️ No se pudo publicar: ${topic} = ${message} (no conectado)`)
    }
  }
  
  const disconnect = () => {
    if (client.value) {
      client.value.end()
      isConnected.value = false
    }
  }
  
  return {
    connect,
    disconnect,
    publish,
    isConnected,
    temperatura,
    humedad,
    estadoESP,
    TOPICS
  }
}