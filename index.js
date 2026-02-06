import "dotenv/config";
import express from "express";
import TelegramBot from "node-telegram-bot-api";

/* =========================
   CONFIG
========================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
const ORACULO_API_URL = process.env.ORACULO_API_URL;

const CHAT_ID_PRIVATE = process.env.CHAT_ID_PRIVATE;
const CHAT_ID_GROUP = process.env.CHAT_ID_GROUP;

const POLL_INTERVAL = 15 * 1000;
const SCORE_MINIMO = 75;

if (!BOT_TOKEN || !RENDER_EXTERNAL_URL || !ORACULO_API_URL) {
  console.error("❌ Variáveis de ambiente faltando");
  process.exit(1);
}

if (!CHAT_ID_PRIVATE || !CHAT_ID_GROUP) {
  console.error("❌ CHAT_ID_PRIVATE ou CHAT_ID_GROUP não configurado");
  process.exit(1);
}

/* =========================
   CACHE ANTI-SPAM
========================= */

const mesaCache = new Map();

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
  await bot.sendMessage(CHAT_ID_PRIVATE, texto, { parse_mode: "HTML" });
  await bot.sendMessage(CHAT_ID_GROUP, texto, { parse_mode: "HTML" });
}

/* =========================
   FORMATADORES
========================= */

function formatarEntrada(mesa) {
  const mesaNome = mesa.mesaNome || "Mesa desconhecida";
  const rodada = mesa.rodada ?? "?";
  const ultimoNumero = mesa.ultimoNumero ?? "?";

  const alvosTxt = mesa.alvos.join(", ");

  return (
    `🚨 <b>ENTRAR AGORA</b> 🚨\n\n` +
    `🎰 <b>Mesa:</b> ${mesaNome}\n` +
    `🎯 <b>Alvos:</b> ${alvosTxt}\n` +
    `🎲 <b>Rodada:</b> ${rodada}/8\n` +
    `🔢 <b>Último Número:</b> ${ultimoNumero}\n` +
    `📊 <b>Score:</b> ${mesa.score}%\n\n` +
    `⚡ <b>Entrada confirmada na rodada 4!</b>`
  );
}

function formatarFinal(mesa) {
  const mesaNome = mesa.mesaNome || "Mesa desconhecida";

  const rodadaFinal = mesa.rodadaResolucao ?? mesa.rodada ?? "?";
  const numeroFinal = mesa.numeroResolucao ?? mesa.ultimoNumero ?? "?";

  const alvosTxt = mesa.alvos.join(", ");

  const emoji = mesa.status === "GREEN" ? "✅" : "❌";
  const titulo = mesa.status === "GREEN" ? "GREEN CONFIRMADO" : "LOSS CONFIRMADO";

  return (
    `${emoji} <b>${titulo}</b> ${emoji}\n\n` +
    `🎰 <b>Mesa:</b> ${mesaNome}\n` +
    `🎯 <b>Alvos:</b> ${alvosTxt}\n` +
    `🏁 <b>Status:</b> ${mesa.status}\n` +
    `🎲 <b>Rodada:</b> ${rodadaFinal}/8\n` +
    `🔢 <b>Número Final:</b> ${numeroFinal}\n` +
    `📊 <b>Score:</b> ${mesa.score}%\n\n` +
    `⚡ <b>Ciclo encerrado. Voltando para caça.</b>`
  );
}

/* =========================
   CONSULTA API
========================= */

async function consultarOraculo() {
  try {
    const res = await fetch(`${ORACULO_API_URL}/oraculo/status`);
    const data = await res.json();

    if (!data || !Array.isArray(data.mesas)) return;

    for (const mesa of data.mesas) {
      const mesaId = mesa.mesaId;
      if (!mesaId) continue;

      const status = mesa.status;
      const rodada = mesa.rodada;
      const score = mesa.score ?? 0;

      const alvosValidos = Array.isArray(mesa.alvos) && mesa.alvos.length > 0;

      if (!mesaCache.has(mesaId)) {
        mesaCache.set(mesaId, {
          entradaEnviada: false,
          finalEnviado: false
        });
      }

      const cache = mesaCache.get(mesaId);

      // 🔥 BLOQUEIA QUALQUER COISA SEM ALVOS
      if (!alvosValidos && status === "ATIVO") continue;

      // 🔥 BLOQUEIA SCORE BAIXO
      if (status === "ATIVO" && score < SCORE_MINIMO) continue;

      // ENTRADA → apenas 1 vez (rodada 4)
      if (status === "ATIVO" && rodada === 4) {
        if (cache.entradaEnviada) continue;

        await enviarMensagem(formatarEntrada(mesa));
        cache.entradaEnviada = true;
        continue;
      }

      // FINAL → apenas 1 vez e encerra ciclo
      if (status === "GREEN" || status === "LOSS") {
        if (cache.finalEnviado) continue;

        await enviarMensagem(formatarFinal(mesa));
        cache.finalEnviado = true;

        // apaga cache pra permitir novo ciclo no futuro
        setTimeout(() => {
          mesaCache.delete(mesaId);
        }, 15000);

        continue;
      }
    }
  } catch (err) {
    console.error("❌ Erro no polling:", err.message);
  }
}

/* =========================
   LOOP
========================= */

console.log("⏱️ Bot monitorando API...");
setInterval(() => {
  consultarOraculo();
}, POLL_INTERVAL);

/* =========================
   START
========================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 BOT ativo na porta", PORT);
});
