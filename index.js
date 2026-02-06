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

const POLL_INTERVAL = 2 * 60 * 1000; // 2 minutos

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
   LINKS DAS MESAS
========================= */

const LINKS_MESAS = {
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

function alvosValidos(alvos) {
  if (!Array.isArray(alvos)) return false;
  if (!alvos.length) return false;

  // não pode ser só 0
  if (alvos.length === 1 && alvos[0] === 0) return false;

  return true;
}

function cycleKey(mesa) {
  const a = Array.isArray(mesa.alvos) ? mesa.alvos.join(",") : "NO_ALVOS";
  return `${mesa.mesaId}|${mesa.status}|${mesa.rodada}|${mesa.ultimoNumero}|${a}`;
}

/* =========================
   CACHE ANTI-SPAM
========================= */

const lastCycleSent = new Map();

/* =========================
   EXPRESS
========================= */

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("BOT ONLINE");
});

/* =========================
   TELEGRAM (WEBHOOK CORRETO)
========================= */

const bot = new TelegramBot(BOT_TOKEN, { webHook: true });

const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;
const WEBHOOK_URL = `${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`;

await bot.setWebHook(WEBHOOK_URL);

console.log("✅ Webhook Telegram registrado:", WEBHOOK_URL);

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
   FORMATADOR
========================= */

function formatarMensagemEntrada(mesa) {
  const mesaNome = mesa.mesaNome || "Mesa desconhecida";
  const rodada = mesa.rodada ?? "?";
  const ultimoNumero = mesa.ultimoNumero ?? "?";

  const alvosTxt = mesa.alvos.join(", ");
  const linkMesa = getMesaLink(mesaNome);

  return (
    `🚨 <b>ENTRAR AGORA</b> 🚨\n\n` +
    `🎰 <b>Mesa:</b> ${mesaNome}\n\n` +
    `🎯 <b>Alvos:</b> ${alvosTxt}\n` +
    `🎲 <b>Rodada:</b> ${rodada} / 8\n` +
    `🔢 <b>Último Número:</b> ${ultimoNumero}\n\n` +
    `🔗 <b>Mesa:</b>\n${linkMesa ? linkMesa : "Link não cadastrado"}\n\n` +
    `⚡ <b>Entre apenas nos alvos e siga o gerenciamento!</b>`
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
      const status = mesa.status;
      const rodada = mesa.rodada ?? 0;

      // só entra em ATIVO na rodada 4
      if (status !== "ATIVO") continue;
      if (rodada !== 4) continue;

      // não envia sem alvos
      if (!alvosValidos(mesa.alvos)) {
        console.log("⛔ Entrada ignorada (sem alvos válidos):", mesa.mesaNome);
        continue;
      }

      const key = cycleKey(mesa);

      // anti spam
      if (lastCycleSent.get(mesa.mesaId) === key) {
        continue;
      }

      lastCycleSent.set(mesa.mesaId, key);

      await enviarMensagem(formatarMensagemEntrada(mesa));
      console.log("📤 Entrada enviada:", mesa.mesaNome, "| rodada:", rodada);
    }
  } catch (err) {
    console.error("❌ Erro ao consultar Oráculo:", err.message);
  }
}

/* =========================
   LOOP POLLING
========================= */

console.log("⏱️ Oráculo será verificado a cada 2 minutos");

consultarOraculo();

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
