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

const MIN_SCORE = Number(process.env.MIN_SCORE || 70); // só envia sinais com score >= isso
const POLL_INTERVAL = 15 * 1000; // 15 segundos (mais rápido e sem delay)

/* =========================
   VALIDACOES
========================= */

if (!BOT_TOKEN || !RENDER_EXTERNAL_URL || !ORACULO_API_URL) {
  console.error("❌ Variáveis de ambiente faltando");
  console.log("➡️ BOT_TOKEN:", BOT_TOKEN ? "OK" : "MISSING");
  console.log("➡️ RENDER_EXTERNAL_URL:", RENDER_EXTERNAL_URL ? "OK" : "MISSING");
  console.log("➡️ ORACULO_API_URL:", ORACULO_API_URL ? "OK" : "MISSING");
  process.exit(1);
}

if (!CHAT_ID_PRIVATE || !CHAT_ID_GROUP) {
  console.error("❌ CHAT_ID_PRIVATE ou CHAT_ID_GROUP não configurado");
  console.log("➡️ CHAT_ID_PRIVATE:", CHAT_ID_PRIVATE ? "OK" : "MISSING");
  console.log("➡️ CHAT_ID_GROUP:", CHAT_ID_GROUP ? "OK" : "MISSING");
  process.exit(1);
}

/* =========================
   LINKS DAS MESAS (COMPLETO)
========================= */

const LINKS_MESAS = {
  // PRAGMATIC / BETANO
  "BRASILEIRA PRAGMATIC": "https://www.betano.bet.br/casino/live/games/brazilian-roulette/11354/tables/",
  "AUTO MEGA ROULETTE 0,50": "https://www.betano.bet.br/casino/live/games/auto-mega-roulette/10842/tables/",
  "AUTO ROULETTE 2,50": "https://www.betano.bet.br/casino/live/games/auto-roulette/3502/tables/",
  "DEUTSCHE ROULETTE 2,50": "https://www.betano.bet.br/casino/live/games/deutsche-roulette/3529/tables/",
  "FRENCH ROULLETE": "https://www.betano.bet.br/casino/live/games/french-roulette-la-partage/25698/tables/",
  "IMMERSIVE DELUXE": "https://www.betano.bet.br/casino/live/games/immersive-roulette-deluxe/23563/tables/",
  "MEGA ROULETTE": "https://www.betano.bet.br/casino/live/games/mega-roulette/3523/tables/",
  "MEGA ROULETTE BRAZILIAN": "https://www.betano.bet.br/casino/live/games/mega-roulette-brazilian/17775/tables/",
  "ORION ROULLETE": "https://www.betano.bet.br/casino/live/games/orion-roulette/25636/tables/",
  "POWER UP ROULETTE": "https://www.betano.bet.br/casino/live/games/powerup-roulette/8193/tables/",
  "ROMANIAN ROULETTE": "https://www.betano.bet.br/casino/live/games/romanian-roulette/7632/tables/",
  "ROULETTE 1": "https://www.betano.bet.br/casino/live/games/roulette-1/3528/tables/",
  "ROULETTW EXTRA TIME2": "https://www.betano.bet.br/casino/live/games/roulette-2-extra-time/3527/tables/",
  "ROULETTE ITALIAN TRICOLORE": "https://www.betano.bet.br/casino/live/games/roulette-italia-tricolore/3530/tables/",
  "ROULETTE LATINA2": "https://www.betano.bet.br/casino/live/games/roulette-latina/8192/tables/",
  "ROULETTE MACAO": "https://www.betano.bet.br/casino/live/games/roulette-macao/3531/tables/",
  "RUSSIAN ROULETTE": "https://www.betano.bet.br/casino/live/games/russian-roulette/3532/tables/",
  "SPEED ROULETTE": "https://www.betano.bet.br/casino/live/games/speed-roulette-1/3539/tables/",
  "SPEED ROULETTE LATINA": "https://www.betano.bet.br/casino/live/games/speed-roulette-latina/32783/tables/",
  "TURKISH MEGA ROULETTE": "https://www.betano.bet.br/casino/live/games/turkish-mega-roulette/17844/tables/",
  "TURKISH ROULETTE": "https://www.betano.bet.br/casino/live/games/turkish-roulette/3533/tables/",
  "VIP ROULETTE": "https://www.betano.bet.br/casino/live/games/vip-roulette/4859/tables/",
  "MEGA ROULETTE 3000": "https://www.betano.bet.br/casino/live/games/mega-roulette-3000/31954/tables/",

  // EVOLUTION
  "LIGHTNING STORM": "https://www.betano.bet.br/casino/live/games/lightning-storm/16782/tables/",
  "ROLETA RELAMPAGO": "https://www.betano.bet.br/casino/live/games/roleta-relampago/7895/tables/",
  "ROLETA AO VIVO": "https://www.betano.bet.br/casino/live/games/roleta-ao-vivo/7899/tables/",
  "FIREBALL ROULETTE": "https://www.betano.bet.br/casino/live/games/fireball-roulette/25208/tables/",
  "XXXTREME LIGHTNING ROULETTE": "https://www.betano.bet.br/casino/live/games/xxxtreme-lightning-roulette/6828/tables/",
  "AUTO ROULETTE": "https://www.betano.bet.br/casino/live/games/auto-roulette/1529/tables/",
  "LIGHTNING ROULETTE": "https://www.betano.bet.br/casino/live/games/lightning-roulette/1524/tables/",
  "ROULETTE1": "https://www.betano.bet.br/casino/live/games/roulette/1526/tables/",
  "SPEED AUTO ROULETTE": "https://www.betano.bet.br/casino/live/games/speed-auto-roulette/1538/tables/",
  "AUTO ROULETTE VIP": "https://www.betano.bet.br/casino/live/games/auto-roulette-vip/1539/tables/",
  "SPEED ROULETTE EVOLUTION": "https://www.betano.bet.br/casino/live/games/speed-roulette/1530/tables/",
  "VIP ROULETTE EVOLUTION": "https://www.betano.bet.br/casino/live/games/vip-roulette/1532/tables/",
  "RULETA EN ESPANOL": "https://www.betano.bet.br/casino/live/games/ruleta-en-espanol/6821/tables/",
  "INSTANT ROULETTE": "https://www.betano.bet.br/casino/live/games/instant-roulette/2181/tables/",

  // EZUGI
  "AUTO ROULETTE EZUGI": "https://www.betano.bet.br/casino/live/games/auto-roulette/18598/tables/",
  "EZ ROULETTE BRAZIL": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-brazil/15673/",
  "EZ ROULETTE ENGLISH": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-english/15670/",
  "EZ ROULETTE HINDI": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-hindi/25230/",
  "EZ ROULETTE JAPANESE": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-japanese/15671/",
  "EZ ROULETTE LATINA": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-latina/23554/",
  "E ROULETTE MANDARIN": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-mandarin/15672/",
  "EZ ROULETTE NEDERLANDS": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-nederlands/25231/",
  "EZ ROULETTE SAVANNA": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-savanna/24258/",
  "EZ ROULETTE THAI": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-thai/15669/",
  "EZ ROULETTE TURKISH": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-turkish/21263/",
  "EZ ROULETTE FOOTBALL AUTO": "https://www.betano.bet.br/casino/live/games/football-auto-roulette/15718/tables/",
  "EZ ROULETTE HALLOWEEN AUTO": "https://www.betano.bet.br/casino/live/games/halloween-auto-roulette/31277/tables/",
  "EZ ROULETTE HORSE RACING": "https://www.betano.bet.br/casino/live/games/horse-racing-auto-roulette/23875/tables/",
  "EZ ROULETTE ITALIAN": "https://www.betano.bet.br/casino/live/games/italian-roulette/18591/tables/"
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
   CACHE ANTI-SPAM
========================= */

const mesaCache = new Map();

/*
cache:
{
  lastSentType: "ENTRAR" | "GREEN" | "LOSS",
  lastCycleKey: "6,10",
  lastRoundSent: 4,
  lastNumberSent: 22
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

function formatarMensagemEntrada(mesa) {
  const mesaId = mesa.mesaId || "SEM_ID";
  const mesaNome = mesa.mesaNome || "Mesa desconhecida";
  const rodada = mesa.rodada ?? "?";
  const ultimoNumero = mesa.ultimoNumero ?? "?";

  const alvosTxt =
    Array.isArray(mesa.alvos) && mesa.alvos.length
      ? mesa.alvos.join(", ")
      : "Sem alvos";

  const linkMesa = getMesaLink(mesaNome);

  const score = mesa.score ?? 0;

  return (
    `🚨 <b>ENTRAR AGORA</b> 🚨\n\n` +
    `🎰 <b>Mesa:</b> ${mesaNome}\n` +
    `🆔 <b>ID:</b> ${mesaId}\n\n` +
    `🎯 <b>Alvos:</b> ${alvosTxt}\n` +
    `🎲 <b>Rodada:</b> ${rodada}\n` +
    `🔢 <b>Último número:</b> ${ultimoNumero}\n` +
    `📊 <b>Score:</b> ${score}\n\n` +
    `🔗 <b>Mesa:</b>\n${linkMesa ? linkMesa : "Link não cadastrado"}\n\n` +
    `⚡ <b>Entrada autorizada (rodada 4).</b>`
  );
}

function formatarMensagemFinal(mesa) {
  const mesaId = mesa.mesaId || "SEM_ID";
  const mesaNome = mesa.mesaNome || "Mesa desconhecida";
  const rodada = mesa.rodada ?? "?";
  const ultimoNumero = mesa.ultimoNumero ?? "?";

  const alvosTxt =
    Array.isArray(mesa.alvos) && mesa.alvos.length
      ? mesa.alvos.join(", ")
      : "Sem alvos";

  const linkMesa = getMesaLink(mesaNome);

  const score = mesa.score ?? 0;

  const emoji = mesa.status === "GREEN" ? "✅" : "❌";
  const titulo = mesa.status === "GREEN" ? "GREEN CONFIRMADO" : "LOSS CONFIRMADO";

  return (
    `${emoji} <b>${titulo}</b> ${emoji}\n\n` +
    `🎰 <b>Mesa:</b> ${mesaNome}\n` +
    `🆔 <b>ID:</b> ${mesaId}\n\n` +
    `🎯 <b>Alvos:</b> ${alvosTxt}\n` +
    `🎲 <b>Rodada:</b> ${rodada}\n` +
    `🔢 <b>Número final:</b> ${ultimoNumero}\n` +
    `📊 <b>Score:</b> ${score}\n\n` +
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
      const rodada = mesa.rodada ?? null;
      const ultimoNumero = mesa.ultimoNumero ?? null;
      const score = mesa.score ?? 0;

      if (!mesaCache.has(mesaId)) {
        mesaCache.set(mesaId, {
          lastSentType: null,
          lastCycleKey: null,
          lastRoundSent: null,
          lastNumberSent: null
        });
      }

      const cache = mesaCache.get(mesaId);
      const cycleKey = normalizeAlvos(mesa.alvos);

      // FILTRO SCORE
      if (status === "ATIVO" || status === "ENTRAR") {
        if (score < MIN_SCORE) {
          continue;
        }
      }

      // ==========================
      // ENTRADA: só manda na rodada 4
      // ==========================
      if ((status === "ATIVO" || status === "ENTRAR") && rodada === 4) {
        if (
          cache.lastSentType === "ENTRAR" &&
          cache.lastCycleKey === cycleKey &&
          cache.lastRoundSent === rodada &&
          cache.lastNumberSent === ultimoNumero
        ) {
          continue;
        }

        cache.lastSentType = "ENTRAR";
        cache.lastCycleKey = cycleKey;
        cache.lastRoundSent = rodada;
        cache.lastNumberSent = ultimoNumero;

        await enviarMensagem(formatarMensagemEntrada(mesa));
        console.log("📤 Enviado ENTRAR AGORA:", mesaId);
        continue;
      }

      // ==========================
      // RESULTADO FINAL
      // ==========================
      if (status === "GREEN" || status === "LOSS") {
        if (
          cache.lastSentType === status &&
          cache.lastCycleKey === cycleKey &&
          cache.lastRoundSent === rodada &&
          cache.lastNumberSent === ultimoNumero
        ) {
          continue;
        }

        cache.lastSentType = status;
        cache.lastCycleKey = cycleKey;
        cache.lastRoundSent = rodada;
        cache.lastNumberSent = ultimoNumero;

        await enviarMensagem(formatarMensagemFinal(mesa));
        console.log("🏁 Enviado resultado:", status, mesaId);
        continue;
      }
    }
  } catch (err) {
    console.error("❌ Erro ao consultar Oráculo:", err.message);
  }
}

/* =========================
   LOOP
========================= */

console.log(`⏱️ Oráculo será verificado a cada ${POLL_INTERVAL / 1000}s`);
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
