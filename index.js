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

/* =========================
   CACHE DE DUPLICAÇÃO
========================= */

// evita repetir sinal
const lastSignalByMesa = new Map();

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

// rota webhook
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// responde start
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

    // só sinais ATIVOS
    const ativos = data.mesas.filter((m) => m.status === "ATIVO");

    if (!ativos.length) {
      console.log("⏳ Nenhum sinal ATIVO no momento");
      return;
    }

    for (const mesa of ativos) {
      const mesaId = mesa.mesaId || "SEM_ID";
      const mesaNome = mesa.mesaNome || "Mesa desconhecida";
      const rodada = mesa.rodada ?? "N/A";
      const ultimoNumero = mesa.ultimoNumero ?? "N/A";

      const assinatura = `${mesa.status}-${rodada}-${ultimoNumero}`;

      // evita repetir o mesmo sinal
      if (lastSignalByMesa.get(mesaId) === assinatura) {
        continue;
      }

      lastSignalByMesa.set(mesaId, assinatura);

      const linkMesa = getMesaLink(mesaNome);

      const mensagem =
        `🚨 <b>SINAL ATIVO DETECTADO</b>\n\n` +
        `🎰 <b>Mesa:</b> ${mesaNome}\n` +
        `🆔 <b>ID:</b> ${mesaId}\n` +
        `📍 <b>Status:</b> ${mesa.status}\n` +
        `🎯 <b>Rodada:</b> ${rodada}\n` +
        `🔢 <b>Último número:</b> ${ultimoNumero}\n\n` +
        (linkMesa ? `🔗 <b>Link da Mesa:</b>\n${linkMesa}\n\n` : "") +
        `⚡ <b>Oráculo V27 Monitorando...</b>`;

      await enviarMensagem(mensagem);
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
