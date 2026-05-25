import { reactive, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrInterpolate, ssrRenderClass, ssrRenderList } from 'vue/server-renderer';
import mqtt from 'mqtt';
import { _ as _export_sfc } from './server.mjs';
import '../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const useMQTT = () => {
  const client = ref(null);
  const isConnected = ref(false);
  const temperatura = ref("--");
  const humedad = ref("--");
  const estadoESP = ref("OFFLINE");
  const BROKER_URL = "wss://broker.hivemq.com:8884/mqtt";
  const OPTIONS = {
    clean: true,
    reconnectPeriod: 5e3,
    connectTimeout: 3e4,
    keepalive: 60,
    protocol: "wss"
  };
  const TOPICS = {
    TEMPERATURA: "casa/temperatura",
    HUMEDAD: "casa/humedad",
    ESTADO: "casa/estado",
    LED_D5: "casa/D5",
    LED_D6: "casa/D6",
    LED_D7: "casa/D7",
    LED_D8: "casa/D8"
  };
  const connect = () => {
    console.log("🔌 Conectando a broker público HiveMQ...");
    client.value = mqtt.connect(BROKER_URL, OPTIONS);
    client.value.on("connect", () => {
      console.log("✅ Conectado a HiveMQ Público");
      isConnected.value = true;
      estadoESP.value = "ESP ONLINE";
      client.value.subscribe(TOPICS.TEMPERATURA);
      client.value.subscribe(TOPICS.HUMEDAD);
      client.value.subscribe(TOPICS.ESTADO);
    });
    client.value.on("message", (topic, message) => {
      const payload = message.toString();
      console.log(`📨 Mensaje recibido: ${topic} = ${payload}`);
      if (topic === TOPICS.TEMPERATURA) temperatura.value = payload;
      if (topic === TOPICS.HUMEDAD) humedad.value = payload;
      if (topic === TOPICS.ESTADO) estadoESP.value = payload;
    });
    client.value.on("error", (err) => {
      console.error("❌ Error MQTT:", err);
      isConnected.value = false;
    });
    client.value.on("close", () => {
      console.log("🔌 Conexión MQTT cerrada");
      isConnected.value = false;
      estadoESP.value = "OFFLINE";
    });
    client.value.on("reconnect", () => {
      console.log("🔄 Reintentando conexión MQTT...");
    });
  };
  const publish = (topic, message) => {
    if (client.value && isConnected.value) {
      client.value.publish(topic, message);
      console.log(`📤 Publicado: ${topic} = ${message}`);
    } else {
      console.warn(`⚠️ No se pudo publicar: ${topic} = ${message} (no conectado)`);
    }
  };
  const disconnect = () => {
    if (client.value) {
      client.value.end();
      isConnected.value = false;
    }
  };
  return {
    connect,
    disconnect,
    publish,
    isConnected,
    temperatura,
    humedad,
    estadoESP,
    TOPICS
  };
};
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const { temperatura, humedad, estadoESP } = useMQTT();
    const ledStates = reactive({
      D5: false,
      D6: false,
      D7: false,
      D8: false
    });
    const hora = ref("--:--:--");
    const modo = ref("oscuro");
    const fondosOscuro = [
      "https://fbsugjqjbltvvyywfsal.supabase.co/storage/v1/object/public/product-images/Fondo1.jpg",
      "https://fbsugjqjbltvvyywfsal.supabase.co/storage/v1/object/public/product-images/Fondo2.jpg"
    ];
    const paneles = ["na1", "na2"];
    const fondoActual = ref(fondosOscuro[0]);
    const panelActual = ref(paneles[0]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["glass-container", modo.value]
      }, _attrs))} data-v-65417195><div class="background" style="${ssrRenderStyle({ backgroundImage: `url(${fondoActual.value})` })}" data-v-65417195></div><div class="content" data-v-65417195><div class="header" data-v-65417195><div class="sensor-left" data-v-65417195><span class="sensor-icon" data-v-65417195>🌡️</span><span class="sensor-value" data-v-65417195>${ssrInterpolate(unref(temperatura))}</span><span class="sensor-unit" data-v-65417195>°C</span></div><div class="logo-block" data-v-65417195><img src="https://fbsugjqjbltvvyywfsal.supabase.co/storage/v1/object/public/product-images/NetFooter.png" alt="Logo" class="logo-icon" data-v-65417195><h2 class="title" data-v-65417195>Control Iluminación</h2><div class="${ssrRenderClass([unref(estadoESP) === "ESP ONLINE" ? "online" : "offline", "status-badge"])}" data-v-65417195>${ssrInterpolate(unref(estadoESP) === "ESP ONLINE" ? "● ONLINE" : "● OFFLINE")}</div></div><div class="sensor-right" data-v-65417195><span class="sensor-icon" data-v-65417195>💧</span><span class="sensor-value" data-v-65417195>${ssrInterpolate(unref(humedad))}</span><span class="sensor-unit" data-v-65417195>%</span></div></div><div class="clock" data-v-65417195>${ssrInterpolate(hora.value)}</div><div class="${ssrRenderClass(["glass-buttons", panelActual.value])}" data-v-65417195><!--[-->`);
      ssrRenderList(["D5", "D6", "D7", "D8"], (pin) => {
        _push(`<button class="${ssrRenderClass({ active: ledStates[pin] })}" data-v-65417195> LED ${ssrInterpolate(pin)} <span class="led-status" data-v-65417195>${ssrInterpolate(ledStates[pin] ? "🟢" : "⚪")}</span></button>`);
      });
      _push(`<!--]--></div><div class="action-buttons" data-v-65417195><button class="action-btn" data-v-65417195>💡 TODOS ON</button><button class="action-btn off" data-v-65417195>🛑 TODOS OFF</button></div><div class="mode-toggle" data-v-65417195><button data-v-65417195> 🌓 Cambiar a ${ssrInterpolate(modo.value === "oscuro" ? "claro" : "oscuro")}</button></div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-65417195"]]);

export { index as default };
//# sourceMappingURL=index-D4QiNYaz.mjs.map
