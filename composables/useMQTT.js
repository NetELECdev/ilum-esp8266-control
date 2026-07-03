// composables/useMQTT.js
import mqtt from 'mqtt'
import { ref } from 'vue'

export const useMQTT = () => {
  const client = ref(null)
  const isConnected = ref(false)
  
  // Sensores
  const temperatura = ref('--')
  const humedad = ref('--')
  const estadoESP = ref('OFFLINE')
  
  // Estados reales de las luces (confirmados por ESP)
  const luz01 = ref(false)
  const luz02 = ref(false)
  const luz03 = ref(false)
  const luz04 = ref(false)
  
  // Estados pendientes (para indicador visual)
  const pending = ref(null) // 'luz01', 'luz02', etc. o null
  
  // Configuración
  const BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt'
  const PREFIX = 'netelec'
  
  const TOPICS = {
    TEMP: `${PREFIX}/temperatura`,
    HUM: `${PREFIX}/humedad`,
    ESTADO: `${PREFIX}/estado`,
    LUZ01_CMD: `${PREFIX}/luz01`,
    LUZ01_STATUS: `${PREFIX}/luz01/status`,
    LUZ02_CMD: `${PREFIX}/luz02`,
    LUZ02_STATUS: `${PREFIX}/luz02/status`,
    LUZ03_CMD: `${PREFIX}/luz03`,
    LUZ03_STATUS: `${PREFIX}/luz03/status`,
    LUZ04_CMD: `${PREFIX}/luz04`,
    LUZ04_STATUS: `${PREFIX}/luz04/status`,
  }
  
  const connect = () => {
    console.log('🔌 Conectando a MQTT...')
    
    client.value = mqtt.connect(BROKER_URL, {
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      keepalive: 60,
      protocol: 'wss'
    })
    
    client.value.on('connect', () => {
      console.log('✅ MQTT conectado')
      isConnected.value = true
      estadoESP.value = 'ONLINE'
      
      // Suscribirse a todos los topics
      client.value.subscribe(TOPICS.TEMP)
      client.value.subscribe(TOPICS.HUM)
      client.value.subscribe(TOPICS.ESTADO)
      client.value.subscribe(TOPICS.LUZ01_STATUS)
      client.value.subscribe(TOPICS.LUZ02_STATUS)
      client.value.subscribe(TOPICS.LUZ03_STATUS)
      client.value.subscribe(TOPICS.LUZ04_STATUS)
    })
    
    client.value.on('message', (topic, message) => {
      const payload = message.toString()
      console.log(`📨 ${topic} = ${payload}`)
      
      switch (topic) {
        case TOPICS.TEMP:
          temperatura.value = payload
          break
        case TOPICS.HUM:
          humedad.value = payload
          break
        case TOPICS.ESTADO:
          estadoESP.value = payload
          break
        case TOPICS.LUZ01_STATUS:
          luz01.value = (payload === 'ON')
          if (pending.value === 'luz01') pending.value = null
          break
        case TOPICS.LUZ02_STATUS:
          luz02.value = (payload === 'ON')
          if (pending.value === 'luz02') pending.value = null
          break
        case TOPICS.LUZ03_STATUS:
          luz03.value = (payload === 'ON')
          if (pending.value === 'luz03') pending.value = null
          break
        case TOPICS.LUZ04_STATUS:
          luz04.value = (payload === 'ON')
          if (pending.value === 'luz04') pending.value = null
          break
      }
    })
    
    client.value.on('error', (err) => {
      console.error('❌ MQTT error:', err.message)
      isConnected.value = false
    })
    
    client.value.on('close', () => {
      console.log('🔌 MQTT desconectado')
      isConnected.value = false
      estadoESP.value = 'OFFLINE'
    })
    
    client.value.on('reconnect', () => {
      console.log('🔄 Reconectando MQTT...')
    })
  }
  
  const toggleLuz = (numero) => {
    if (!client.value || !isConnected.value) {
      console.warn('⚠️ MQTT no conectado')
      return
    }
    
    const topicMap = {
      1: { cmd: TOPICS.LUZ01_CMD, status: TOPICS.LUZ01_STATUS, ref: luz01, name: 'luz01' },
      2: { cmd: TOPICS.LUZ02_CMD, status: TOPICS.LUZ02_STATUS, ref: luz02, name: 'luz02' },
      3: { cmd: TOPICS.LUZ03_CMD, status: TOPICS.LUZ03_STATUS, ref: luz03, name: 'luz03' },
      4: { cmd: TOPICS.LUZ04_CMD, status: TOPICS.LUZ04_STATUS, ref: luz04, name: 'luz04' },
    }
    
    const luz = topicMap[numero]
    if (!luz) return
    
    const nuevoEstado = !luz.ref.value
    const mensaje = nuevoEstado ? 'ON' : 'OFF'
    
    pending.value = luz.name
    client.value.publish(luz.cmd, mensaje)
    console.log(`📤 ${luz.cmd} = ${mensaje}`)
    
    // Timeout: si en 3 segundos no llega confirmación, limpiar pending
    setTimeout(() => {
      if (pending.value === luz.name) {
        console.warn(`⚠️ Timeout esperando confirmación de ${luz.name}`)
        pending.value = null
      }
    }, 3000)
  }
  
  const todasOn = () => {
    toggleLuz(1); toggleLuz(2); toggleLuz(3); toggleLuz(4)
  }
  
  const todasOff = () => {
    toggleLuz(1); toggleLuz(2); toggleLuz(3); toggleLuz(4)
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
    toggleLuz,
    todasOn,
    todasOff,
    isConnected,
    temperatura,
    humedad,
    estadoESP,
    luz01,
    luz02,
    luz03,
    luz04,
    pending,
    TOPICS
  }
}