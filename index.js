import express from "express";
import TelegramBot from "node-telegram-bot-api";

/* =========================
   ENV
========================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
const ORACULO_API_URL = process.env.ORACULO_API_URL; // ex: https://oraculo-api-vqn8.onrender.com
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN || !RENDER_EXTERNAL_URL || !ORACULO_API_URL || !CHAT_ID) {
  console.error("❌ Variáveis de ambiente faltando");
  console.log("➡️ BOT_TOKEN:", BOT_TOKEN ? "OK" : "MISSING");
  console.log("➡️ RENDER_EXTERNAL_URL:", RENDER_EXTERNAL_URL ? "OK" : "MISSING");
  console.log("➡️ ORACULO_API_URL:", ORACULO_API_URL ? "OK" : "MISSING");
  console.log("➡️ CHAT_ID:", CHAT_ID ? "OK" : "MISSING");
  process.exit(1);
}

/* =========================
   CONFIG
========================= */

const POLL_INTERVAL = 2 * 60 * 1000; // 2 minutos

/* =========================
   LINKS DAS MESAS (MAPA)
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
  "xxxTREME LIGHTNING ROULETTE": "https://www.betano.bet.br/casino/live/games/xxxtreme-lightning-roulette/6828/tables/",
  "AUTO ROULETTE EVOLUTION": "https://www.betano.bet.br/casino/live/games/auto-roulette/1529/tables/",
  "LIGHTNING ROULETTE": "https://www.betano.bet.br/casino/live/games/lightning-roulette/1524/tables/",
  "ROULETTE1": "https://www.betano.bet.br/casino/live/games/roulette/1526/tables/",
  "SPEED AUTO ROULETTE": "https://www.betano.bet.br/casino/live/games/speed-auto-roulette/1538/tables/",
  "AUTO ROULETTE VIP": "https://www.betano.bet.br/casino/live/games/auto-roulette-vip/1539/tables/",
  "SPEED ROULETTE EVOLUTION": "https://www.betano.bet.br/casino/live/games/speed-roulette/1530/tables/",
  "VIP ROULETTE EVOLUTION": "https://www.betano.bet.br/casino/live/games/vip-roulette/1532/tables/",
  "RULETA EN ESPANOL": "https://www.betano.bet.br/casino/live/games/ruleta-en-espanol/6821/tables/",
  "Instant ROULETTE": "https://www.betano.bet.br/casino/live/games/instant-roulette/2181/tables/",

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
   BOT + SERVER
========================= */

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("BOT ONLINE");
});

const bot = new TelegramBot(BOT_TOKEN);
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;

await bot.setWebHook(`${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`);
console.log("✅ Webhook Telegram registrado:", `${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`);

app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "🤖 Oráculo Bot está ONLINE.\n\n✅ Estou monitorando a API e enviarei apenas sinais ATIVOS."
  );
});

/* =========================
   DEDUP (ANTI-SPAM)
========================= */

const sentSignals = new Set();

function buildSignalKey(mesa) {
  return `${mesa.mesaId}|${mesa.status}|${mesa.ultimoNumero}|${mesa.rodada}`;
}

/* =========================
   FORMATADOR
========================= */

function formatMessage(mesa) {
  const nomeMesa = mesa.mesaNome || mesa.mesaId;
  const linkMesa = LINKS_MESAS[nomeMesa] || "Link não cadastrado";

  const alvosTxt = Array.isArray(mesa.alvos) && mesa.alvos.length
    ? mesa.alvos.join(", ")
    : "Sem alvos definidos";

  return (
`🚨 *SINAL ATIVO DETECTADO* 🚨

🎰 *Mesa:* ${nomeMesa}
🆔 *ID:* ${mesa.mesaId}

📌 *Status:* ${mesa.status}
🎯 *Alvos:* ${alvosTxt}
🔢 *Último Número:* ${mesa.ultimoNumero ?? "?"}
🎲 *Rodada:* ${mesa.rodada ?? "?"}

🔗 *Acesse a Mesa:*
${linkMesa}

⚡ *Entre apenas nos alvos e siga o gerenciamento!*
`
  );
}

/* =========================
   POLLING API
========================= */

async function consultarOraculo() {
  try {
    const url = `${ORACULO_API_URL}/oraculo/status`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data || !Array.isArray(data.mesas)) {
      console.log("⚠️ Resposta inválida da API.");
      return;
    }

    console.log(`👀 Leitura do Oráculo: ${data.mesas.length} mesas analisadas`);

    const mesasAtivas = data.mesas.filter(m => m.status === "ATIVO");

    if (!mesasAtivas.length) {
      console.log("🟡 Nenhum sinal ATIVO no momento.");
      return;
    }

    for (const mesa of mesasAtivas) {
      const key = buildSignalKey(mesa);

      if (sentSignals.has(key)) {
        continue; // não repete
      }

      sentSignals.add(key);

      const msg = formatMessage(mesa);

      await bot.sendMessage(CHAT_ID, msg, {
        parse_mode: "Markdown"
      });

      console.log("📤 Enviado sinal ATIVO:", mesa.mesaId);
    }

  } catch (err) {
    console.error("❌ Erro ao consultar Oráculo:", err.message);
  }
}

/* =========================
   START LOOP
========================= */

console.log("⏱️ Oráculo será verificado a cada 2 minutos");
setInterval(consultarOraculo, POLL_INTERVAL);

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor ativo na porta", PORT);
});
