import { ref, mergeProps, unref, useSSRContext } from 'vue';
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
  const luz01 = ref(false);
  const luz02 = ref(false);
  const luz03 = ref(false);
  const luz04 = ref(false);
  const pending = ref(null);
  const BROKER_URL = "wss://broker.hivemq.com:8884/mqtt";
  const PREFIX = "netelec";
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
    LUZ04_STATUS: `${PREFIX}/luz04/status`
  };
  const connect = () => {
    console.log("🔌 Conectando a MQTT...");
    client.value = mqtt.connect(BROKER_URL, {
      clean: true,
      reconnectPeriod: 5e3,
      connectTimeout: 3e4,
      keepalive: 60,
      protocol: "wss"
    });
    client.value.on("connect", () => {
      console.log("✅ MQTT conectado");
      isConnected.value = true;
      estadoESP.value = "ONLINE";
      client.value.subscribe(TOPICS.TEMP);
      client.value.subscribe(TOPICS.HUM);
      client.value.subscribe(TOPICS.ESTADO);
      client.value.subscribe(TOPICS.LUZ01_STATUS);
      client.value.subscribe(TOPICS.LUZ02_STATUS);
      client.value.subscribe(TOPICS.LUZ03_STATUS);
      client.value.subscribe(TOPICS.LUZ04_STATUS);
    });
    client.value.on("message", (topic, message) => {
      const payload = message.toString();
      console.log(`📨 ${topic} = ${payload}`);
      switch (topic) {
        case TOPICS.TEMP:
          temperatura.value = payload;
          break;
        case TOPICS.HUM:
          humedad.value = payload;
          break;
        case TOPICS.ESTADO:
          estadoESP.value = payload;
          break;
        case TOPICS.LUZ01_STATUS:
          luz01.value = payload === "ON";
          if (pending.value === "luz01") pending.value = null;
          break;
        case TOPICS.LUZ02_STATUS:
          luz02.value = payload === "ON";
          if (pending.value === "luz02") pending.value = null;
          break;
        case TOPICS.LUZ03_STATUS:
          luz03.value = payload === "ON";
          if (pending.value === "luz03") pending.value = null;
          break;
        case TOPICS.LUZ04_STATUS:
          luz04.value = payload === "ON";
          if (pending.value === "luz04") pending.value = null;
          break;
      }
    });
    client.value.on("error", (err) => {
      console.error("❌ MQTT error:", err.message);
      isConnected.value = false;
    });
    client.value.on("close", () => {
      console.log("🔌 MQTT desconectado");
      isConnected.value = false;
      estadoESP.value = "OFFLINE";
    });
    client.value.on("reconnect", () => {
      console.log("🔄 Reconectando MQTT...");
    });
  };
  const toggleLuz = (numero) => {
    if (!client.value || !isConnected.value) {
      console.warn("⚠️ MQTT no conectado");
      return;
    }
    const topicMap = {
      1: { cmd: TOPICS.LUZ01_CMD, status: TOPICS.LUZ01_STATUS, ref: luz01, name: "luz01" },
      2: { cmd: TOPICS.LUZ02_CMD, status: TOPICS.LUZ02_STATUS, ref: luz02, name: "luz02" },
      3: { cmd: TOPICS.LUZ03_CMD, status: TOPICS.LUZ03_STATUS, ref: luz03, name: "luz03" },
      4: { cmd: TOPICS.LUZ04_CMD, status: TOPICS.LUZ04_STATUS, ref: luz04, name: "luz04" }
    };
    const luz = topicMap[numero];
    if (!luz) return;
    const nuevoEstado = !luz.ref.value;
    const mensaje = nuevoEstado ? "ON" : "OFF";
    pending.value = luz.name;
    client.value.publish(luz.cmd, mensaje);
    console.log(`📤 ${luz.cmd} = ${mensaje}`);
    setTimeout(() => {
      if (pending.value === luz.name) {
        console.warn(`⚠️ Timeout esperando confirmación de ${luz.name}`);
        pending.value = null;
      }
    }, 3e3);
  };
  const todasOn = () => {
    toggleLuz(1);
    toggleLuz(2);
    toggleLuz(3);
    toggleLuz(4);
  };
  const todasOff = () => {
    toggleLuz(1);
    toggleLuz(2);
    toggleLuz(3);
    toggleLuz(4);
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
  };
};
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const mqtt2 = useMQTT();
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
      }, _attrs))} data-v-170326f2><div class="background" style="${ssrRenderStyle({ backgroundImage: `url(${fondoActual.value})` })}" data-v-170326f2></div><div class="content" data-v-170326f2><div class="header" data-v-170326f2><div class="sensor-left" data-v-170326f2><span class="sensor-icon" data-v-170326f2>🌡️</span><span class="sensor-value" data-v-170326f2>${ssrInterpolate(unref(mqtt2).temperatura.value)}</span><span class="sensor-unit" data-v-170326f2>°C</span></div><div class="logo-block" data-v-170326f2><img src="https://fbsugjqjbltvvyywfsal.supabase.co/storage/v1/object/public/product-images/NetFooter.png" alt="Logo" class="logo-icon" data-v-170326f2><h2 class="title" data-v-170326f2>Control Iluminación</h2><div class="${ssrRenderClass([unref(mqtt2).isConnected.value ? "online" : "offline", "status-badge"])}" data-v-170326f2>${ssrInterpolate(unref(mqtt2).isConnected.value ? "● ONLINE" : "● OFFLINE")}</div></div><div class="sensor-right" data-v-170326f2><span class="sensor-icon" data-v-170326f2>💧</span><span class="sensor-value" data-v-170326f2>${ssrInterpolate(unref(mqtt2).humedad.value)}</span><span class="sensor-unit" data-v-170326f2>%</span></div></div><div class="clock" data-v-170326f2>${ssrInterpolate(hora.value)}</div><div class="${ssrRenderClass(["glass-buttons", panelActual.value])}" data-v-170326f2><!--[-->`);
      ssrRenderList(4, (n) => {
        _push(`<button class="${ssrRenderClass({
          active: unref(mqtt2)[`luz0${n}`].value,
          pending: unref(mqtt2).pending.value === `luz0${n}`
        })}" data-v-170326f2><span data-v-170326f2>LUZ 0${ssrInterpolate(n)}</span><span class="led-status" data-v-170326f2>${ssrInterpolate(unref(mqtt2).pending.value === `luz0${n}` ? "⏳" : unref(mqtt2)[`luz0${n}`].value ? "🟢" : "⚪")}</span></button>`);
      });
      _push(`<!--]--></div><div class="action-buttons" data-v-170326f2><button class="action-btn" data-v-170326f2>💡 TODOS ON</button><button class="action-btn off" data-v-170326f2>🛑 TODOS OFF</button></div><div class="mode-toggle" data-v-170326f2><button data-v-170326f2> 🌓 Cambiar a ${ssrInterpolate(modo.value === "oscuro" ? "claro" : "oscuro")}</button></div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-170326f2"]]);

export { index as default };
//# sourceMappingURL=index-kD34baHY.mjs.map
