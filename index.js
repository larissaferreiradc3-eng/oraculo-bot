import express from "express";
import TelegramBot from "node-telegram-bot-api";

/* =========================
   CONFIG
========================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

const ORACULO_API_URL = process.env.ORACULO_API_URL;
// Exemplo: https://oraculo-api-vqn8.onrender.com

const CHAT_ID_PRIVATE = process.env.CHAT_ID_PRIVATE;
const CHAT_ID_GROUP = process.env.CHAT_ID_GROUP;

const POLL_INTERVAL = 2 * 60 * 1000; // 2 minutos

if (!BOT_TOKEN || !RENDER_EXTERNAL_URL || !ORACULO_API_URL) {
  console.error("❌ Variáveis de ambiente faltando");
  process.exit(1);
}

if (!CHAT_ID_PRIVATE || !CHAT_ID_GROUP) {
  console.error("❌ CHAT_ID_PRIVATE ou CHAT_ID_GROUP não configurado");
  process.exit(1);
}

/* =========================
   LINKS DAS MESAS
========================= */

const LINKS_MESAS = {
  "MEGA ROULETTE": "https://www.betano.bet.br/casino/live/games/mega-roulette/3523/tables/",
  "AUTO MEGA ROULETTE": "https://www.betano.bet.br/casino/live/games/auto-mega-roulette/10842/tables/",
  "BRAZILIAN ROULETTE": "https://www.betano.bet.br/casino/live/games/brazilian-roulette/11354/tables/",
  "LIGHTNING ROULETTE": "https://www.betano.bet.br/casino/live/games/lightning-roulette/1524/tables/",
  "ROLETA RELAMPAGO": "https://www.betano.bet.br/casino/live/games/roleta-relampago/7895/tables/",
  "VIP ROULETTE": "https://www.betano.bet.br/casino/live/games/vip-roulette/1532/tables/",
};

/* =========================
   HELPERS
========================= */

function getMesaLink(nomeMesa) {
  if (!nomeMesa) return null;

  const upper = nomeMesa.toUpperCase().trim();

  for (const key of Object.keys(LINKS_MESAS)) {
    if (upper.includes(key)) return LINKS_MESAS[key];
  }

  return null;
}

function normalizeAlvos(alvos) {
  if (!Array.isArray(alvos)) return "";
  return alvos.map((n) => String(n)).join(",");
}

/* =========================
   CACHE (ANTI-SPAM REAL)
========================= */

// Guarda o último status enviado por mesa (ATIVO/GREEN/LOSS)
// E guarda o "ciclo" atual baseado em alvos
const mesaCache = new Map();

/*
mesaCache = {
  mesaId: {
    lastStatusSent: "ATIVO" | "GREEN" | "LOSS" | null,
    lastCycleKey: "alvosString",
  }
}
*/

/* =========================
   EXPRESS
========================= */

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("BOT ONLINE");
});

/* =========================
   TELEGRAM
========================= */

const bot = new TelegramBot(BOT_TOKEN);
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;

await bot.setWebHook(`${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`);
console.log("✅ Webhook Telegram registrado:", `${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`);

app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(msg.chat.id, "🤖 Oráculo Bot online e conectado!");
});

/* =========================
   FUNÇÃO DE ENVIO
========================= */

async function enviarMensagem(texto) {
  try {
    await bot.sendMessage(CHAT_ID_PRIVATE, texto, { parse_mode: "HTML" });
  } catch (err) {
    console.error("❌ Erro ao enviar no privado:", err.message);
  }

  try {
    await bot.sendMessage(CHAT_ID_GROUP, texto, { parse_mode: "HTML" });
  } catch (err) {
    console.error("❌ Erro ao enviar no grupo:", err.message);
  }
}

/* =========================
   FORMATADORES
========================= */

function formatarMensagemAtivo(mesa) {
  const mesaId = mesa.mesaId || "SEM_ID";
  const mesaNome = mesa.mesaNome || "Mesa desconhecida";
  const rodada = mesa.rodada ?? "?";
  const ultimoNumero = mesa.ultimoNumero ?? "?";

  const alvosTxt = Array.isArray(mesa.alvos) && mesa.alvos.length
    ? mesa.alvos.join(", ")
    : "Sem alvos";

  const linkMesa = getMesaLink(mesaNome);

  return (
    `🚨 <b>SINAL ATIVO DETECTADO</b> 🚨\n\n` +
    `🎰 <b>Mesa:</b> ${mesaNome}\n` +
    `🆔 <b>ID:</b> ${mesaId}\n\n` +
    `📌 <b>Status:</b> ${mesa.status}\n` +
    `🎯 <b>Alvos:</b> ${alvosTxt}\n` +
    `🔢 <b>Último Número:</b> ${ultimoNumero}\n` +
    `🎲 <b>Rodada:</b> ${rodada}\n\n` +
    `🔗 <b>Acesse a Mesa:</b>\n${linkMesa ? linkMesa : "Link não cadastrado"}\n\n` +
    `⚡ <b>Entre apenas nos alvos e siga o gerenciamento!</b>`
  );
}

function formatarMensagemFinal(mesa) {
  const mesaId = mesa.mesaId || "SEM_ID";
  const mesaNome = mesa.mesaNome || "Mesa desconhecida";
  const rodada = mesa.rodada ?? "?";
  const ultimoNumero = mesa.ultimoNumero ?? "?";

  const alvosTxt = Array.isArray(mesa.alvos) && mesa.alvos.length
    ? mesa.alvos.join(", ")
    : "Sem alvos";

  const linkMesa = getMesaLink(mesaNome);

  const emoji = mesa.status === "GREEN" ? "✅" : "❌";
  const titulo = mesa.status === "GREEN" ? "GREEN CONFIRMADO" : "LOSS CONFIRMADO";

  return (
    `${emoji} <b>${titulo}</b> ${emoji}\n\n` +
    `🎰 <b>Mesa:</b> ${mesaNome}\n` +
    `🆔 <b>ID:</b> ${mesaId}\n\n` +
    `📌 <b>Status:</b> ${mesa.status}\n` +
    `🎯 <b>Alvos:</b> ${alvosTxt}\n` +
    `🔢 <b>Último Número:</b> ${ultimoNumero}\n` +
    `🎲 <b>Rodada final:</b> ${rodada}\n\n` +
    `🔗 <b>Mesa:</b>\n${linkMesa ? linkMesa : "Link não cadastrado"}\n\n` +
    `⚡ <b>Oráculo encerrado. Voltando para caça.</b>`
  );
}

/* =========================
   CONSULTA API ORÁCULO
========================= */

async function consultarOraculo() {
  try {
    const res = await fetch(`${ORACULO_API_URL}/oraculo/status`);
    const data = await res.json();

    if (!data || !Array.isArray(data.mesas)) {
      console.log("⚠️ Resposta inválida do Oráculo");
      return;
    }

    console.log(`👀 Leitura do Oráculo: ${data.mesas.length} mesas analisadas`);

    for (const mesa of data.mesas) {
      const mesaId = mesa.mesaId || "SEM_ID";
      const status = mesa.status;

      if (!mesaCache.has(mesaId)) {
        mesaCache.set(mesaId, {
          lastStatusSent: null,
          lastCycleKey: null
        });
      }

      const cache = mesaCache.get(mesaId);

      // chave do ciclo = alvos
      const cycleKey = normalizeAlvos(mesa.alvos);

      /* =========================
         REGRAS ANTI-SPAM
      ========================= */

      // 1) Se estiver ATIVO:
      // só envia uma vez por ciclo (alvos)
      if (status === "ATIVO") {
        if (cache.lastStatusSent === "ATIVO" && cache.lastCycleKey === cycleKey) {
          continue;
        }

        cache.lastStatusSent = "ATIVO";
        cache.lastCycleKey = cycleKey;

        await enviarMensagem(formatarMensagemAtivo(mesa));
        console.log("📤 Enviado sinal ATIVO:", mesaId);
        continue;
      }

      // 2) Se virar GREEN ou LOSS:
      // só envia uma vez e encerra o ciclo
      if (status === "GREEN" || status === "LOSS") {
        if (cache.lastStatusSent === status && cache.lastCycleKey === cycleKey) {
          continue;
        }

        cache.lastStatusSent = status;
        cache.lastCycleKey = cycleKey;

        await enviarMensagem(formatarMensagemFinal(mesa));
        console.log("🏁 Enviado resultado final:", status, mesaId);

        continue;
      }

      // 3) Se for qualquer outro status, ignora
      // (MONITORANDO, ARMADO, DESCONHECIDO etc)
      continue;
    }
  } catch (err) {
    console.error("❌ Erro ao consultar Oráculo:", err.message);
  }
}

/* =========================
   LOOP POLLING
========================= */

console.log("⏱️ Oráculo será verificado a cada 2 minutos");

setInterval(() => {
  consultarOraculo();
}, POLL_INTERVAL);

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor ativo na porta", PORT);
});
