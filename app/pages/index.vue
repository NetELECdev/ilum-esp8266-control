<template>
  <div class="glass-container" :class="modo">
    <!-- Fondo dinámico -->
    <div class="background" :style="{ backgroundImage: `url(${fondoActual})` }"></div>

    <div class="content">
      <!-- Header con logo y sensores -->
      <div class="header">
        <div class="sensor-left">
          <span class="sensor-icon">🌡️</span>
          <span class="sensor-value">{{ mqtt.temperatura.value }}</span>
          <span class="sensor-unit">°C</span>
        </div>
        
        <div class="logo-block">
          <img 
            src="https://fbsugjqjbltvvyywfsal.supabase.co/storage/v1/object/public/product-images/NetFooter.png" 
            alt="Logo" 
            class="logo-icon" 
          />
          <h2 class="title">Control Iluminación</h2>
          <div class="status-badge" :class="mqtt.isConnected.value ? 'online' : 'offline'">
            {{ mqtt.isConnected.value ? '● ONLINE' : '● OFFLINE' }}
          </div>
        </div>
        
        <div class="sensor-right">
          <span class="sensor-icon">💧</span>
          <span class="sensor-value">{{ mqtt.humedad.value }}</span>
          <span class="sensor-unit">%</span>
        </div>
      </div>

      <!-- Reloj digital -->
      <div class="clock">{{ hora }}</div>

      <!-- Controles LUZ 01-04 -->
      <div :class="['glass-buttons', panelActual]">
        <button 
          v-for="n in 4" 
          :key="n"
          :class="{ 
            active: mqtt[`luz0${n}`].value, 
            pending: mqtt.pending.value === `luz0${n}` 
          }"
          @click="mqtt.toggleLuz(n)"
        >
          <span>LUZ 0{{ n }}</span>
          <span class="led-status">
            {{ mqtt.pending.value === `luz0${n}` ? '⏳' : (mqtt[`luz0${n}`].value ? '🟢' : '⚪') }}
          </span>
        </button>
      </div>

      <!-- Controles adicionales -->
      <div class="action-buttons">
        <button class="action-btn" @click="mqtt.todasOn">💡 TODOS ON</button>
        <button class="action-btn off" @click="mqtt.todasOff">🛑 TODOS OFF</button>
      </div>

      <!-- Toggle modo -->
      <div class="mode-toggle">
        <button @click="cambiarModo">
          🌓 Cambiar a {{ modo === 'oscuro' ? 'claro' : 'oscuro' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useMQTT } from '../../composables/useMQTT'

const mqtt = useMQTT()

const hora = ref('--:--:--')
const modo = ref('oscuro')

const fondosOscuro = [
  'https://fbsugjqjbltvvyywfsal.supabase.co/storage/v1/object/public/product-images/Fondo1.jpg',
  'https://fbsugjqjbltvvyywfsal.supabase.co/storage/v1/object/public/product-images/Fondo2.jpg'
]

const fondosClaro = [
  'https://fbsugjqjbltvvyywfsal.supabase.co/storage/v1/object/public/product-images/Blanca3.jpg',
  'https://fbsugjqjbltvvyywfsal.supabase.co/storage/v1/object/public/product-images/Blanca1.jpg'
]

const paneles = ['na1', 'na2']
const fondoActual = ref(fondosOscuro[0])
const panelActual = ref(paneles[0])

let intervalHora = null
let intervalFondo = null

function cambiarModo() {
  modo.value = modo.value === 'oscuro' ? 'claro' : 'oscuro'
  fondoActual.value = modo.value === 'oscuro' ? fondosOscuro[0] : fondosClaro[0]
}

onMounted(() => {
  mqtt.connect()
  
  intervalHora = setInterval(() => {
    const now = new Date()
    hora.value = now.toLocaleTimeString('es-ES')
  }, 1000)
  
  let i = 0, j = 0
  intervalFondo = setInterval(() => {
    const listaFondos = modo.value === 'oscuro' ? fondosOscuro : fondosClaro
    i = (i + 1) % listaFondos.length
    fondoActual.value = listaFondos[i]
    j = (j + 1) % paneles.length
    panelActual.value = paneles[j]
  }, 15 * 60 * 1000)
})

onUnmounted(() => {
  if (intervalHora) clearInterval(intervalHora)
  if (intervalFondo) clearInterval(intervalFondo)
})
</script>

<style scoped>
.glass-container {
  --text-color: #ffffff;
  --bg-glass: rgba(0, 0, 0, 0.5);
  --border-glass: rgba(255, 255, 255, 0.2);
  --button-bg: rgba(255, 255, 255, 0.15);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.glass-container.claro {
  --text-color: #1a1a2e;
  --bg-glass: rgba(255, 255, 255, 0.6);
  --border-glass: rgba(255, 255, 255, 0.4);
  --button-bg: rgba(0, 0, 0, 0.1);
}

.background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  filter: brightness(0.85);
  transition: background-image 1s ease-in-out;
  z-index: -2;
}

.background::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: -1;
}

.content {
  width: 100%;
  max-width: 550px;
  margin: 20px;
  padding: 25px;
  background: var(--bg-glass);
  backdrop-filter: blur(15px);
  border-radius: 32px;
  border: 1px solid var(--border-glass);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.sensor-left, .sensor-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  padding: 12px 16px;
  border-radius: 20px;
  min-width: 85px;
}

.sensor-icon { font-size: 24px; }
.sensor-value { font-size: 22px; font-weight: bold; color: var(--text-color); }
.sensor-unit { font-size: 12px; opacity: 0.7; }

.logo-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.logo-icon {
  width: 70px;
  height: 70px;
  object-fit: contain;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
}

.title { font-size: 18px; margin: 8px 0 4px; color: var(--text-color); font-weight: 600; }

.status-badge {
  font-size: 10px;
  font-weight: bold;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.5);
}

.status-badge.online { color: #2ecc71; text-shadow: 0 0 5px #2ecc71; }
.status-badge.offline { color: #e74c3c; }

.clock {
  font-family: 'Courier New', monospace;
  font-size: 2.8rem;
  text-align: center;
  margin: 20px 0;
  color: #00ffcc;
  text-shadow: 0 0 10px rgba(0, 255, 204, 0.6);
  font-weight: bold;
  letter-spacing: 4px;
}

.glass-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  border-radius: 28px;
  padding: 20px;
  transition: all 1s ease;
}

.glass-buttons button {
  padding: 18px 12px;
  border: none;
  border-radius: 24px;
  background: var(--button-bg);
  backdrop-filter: blur(4px);
  color: var(--text-color);
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.glass-buttons button:hover {
  transform: scale(1.02);
  background: rgba(46, 204, 113, 0.8);
  color: white;
}

.glass-buttons button.active {
  background: rgba(46, 204, 113, 0.9);
  box-shadow: 0 0 15px rgba(46, 204, 113, 0.5);
}

.glass-buttons button.pending {
  background: rgba(255, 193, 7, 0.6);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.led-status { font-size: 14px; }

.glass-buttons.na1 {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-buttons.na2 {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin: 20px 0;
}

.action-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 40px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--button-bg);
  color: var(--text-color);
  backdrop-filter: blur(4px);
}

.action-btn:hover { background: #2ecc71; color: black; }
.action-btn.off:hover { background: #e74c3c; color: white; }

.mode-toggle {
  text-align: center;
  margin-top: 20px;
}

.mode-toggle button {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 40px;
  padding: 8px 20px;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.mode-toggle button:hover { background: #3498db; }

@media (max-width: 500px) {
  .content { padding: 16px; margin: 12px; }
  .glass-buttons button { padding: 14px 8px; font-size: 14px; }
  .clock { font-size: 2rem; }
  .sensor-value { font-size: 18px; }
}
</style>