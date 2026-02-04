import express from "express";
import TelegramBot from "node-telegram-bot-api";

/* =========================
   ENV
========================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
const CHAT_ID = process.env.CHAT_ID;
const ORACULO_API_URL = process.env.ORACULO_API_URL;

if (!BOT_TOKEN || !RENDER_EXTERNAL_URL || !CHAT_ID || !ORACULO_API_URL) {
  console.error("❌ Variáveis de ambiente faltando");
  process.exit(1);
}

/* =========================
   LINKS DAS MESAS (POR NOME)
========================= */

const MESA_LINKS_BY_NAME = {
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
  "xxxTREME LIGHTNING ROULETTE": "https://www.betano.bet.br/casino/live/games/xxxtreme-lightning-roulette/6828/tables/",
  "AUTO ROULETTE": "https://www.betano.bet.br/casino/live/games/auto-roulette/1529/tables/",
  "LIGHTNING ROULETTE": "https://www.betano.bet.br/casino/live/games/lightning-roulette/1524/tables/",
  "ROULETTE1": "https://www.betano.bet.br/casino/live/games/roulette/1526/tables/",
  "SPEED AUTO ROULETTE": "https://www.betano.bet.br/casino/live/games/speed-auto-roulette/1538/tables/",
  "AUTO ROULETTE VIP": "https://www.betano.bet.br/casino/live/games/auto-roulette-vip/1539/tables/",
  "SPEED ROULETTE (EVOLUTION)": "https://www.betano.bet.br/casino/live/games/speed-roulette/1530/tables/",
  "VIP ROULETTE (EVOLUTION)": "https://www.betano.bet.br/casino/live/games/vip-roulette/1532/tables/",
  "RULETA EN ESPANOL": "https://www.betano.bet.br/casino/live/games/ruleta-en-espanol/6821/tables/",
  "Instant ROULETTE": "https://www.betano.bet.br/casino/live/games/instant-roulette/2181/tables/",

  // EZUGI
  "AUTO ROULETTE (EZUGI)": "https://www.betano.bet.br/casino/live/games/auto-roulette/18598/tables/",
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

function normalizarNome(nome) {
  if (!nome) return "";
  return nome
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function getMesaLink(mesaNome) {
  const nomeNormalizado = normalizarNome(mesaNome);

  for (const key of Object.keys(MESA_LINKS_BY_NAME)) {
    if (normalizarNome(key) === nomeNormalizado) {
      return MESA_LINKS_BY_NAME[key];
    }
  }

  return null;
}

/* =========================
   APP
========================= */

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🤖 ORÁCULO BOT ONLINE — ATIVOS + LINKS + SEM REPETIÇÃO");
});

/* =========================
   TELEGRAM
========================= */

const bot = new TelegramBot(BOT_TOKEN);

const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;
const WEBHOOK_URL = `${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`;

await bot.setWebHook(WEBHOOK_URL);
console.log("✅ Webhook Telegram registrado:", WEBHOOK_URL);

app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🔮 Oráculo Bot ativo.\n🟢 Mostrando apenas sinais ATIVOS.\n⏱️ Polling: 2 minutos.\n🔗 Links incluídos."
  );
});

/* =========================
   ANTI REPETIÇÃO (FINGERPRINT)
========================= */

const ultimoFingerprintPorMesa = new Map();

function gerarFingerprint(mesa) {
  return JSON.stringify({
    mesaId: mesa.mesaId ?? null,
    status: mesa.status ?? null,
    ultimoNumero: mesa.ultimoNumero ?? null,
    rodada: mesa.rodada ?? null,
    alvos: Array.isArray(mesa.alvos) ? mesa.alvos : []
  });
}

/* =========================
   ESPELHO ATIVOS
========================= */

const ORACULO_STATUS_URL = `${ORACULO_API_URL}/oraculo/status`;

async function espelharAtivos() {
  try {
    const response = await fetch(ORACULO_STATUS_URL);
    const data = await response.json();

    if (!data || !Array.isArray(data.mesas)) {
      console.log("⚠️ API retornou dados inválidos");
      return;
    }

    const ativos = data.mesas.filter(m => m.status === "ATIVO");

    console.log(`🟢 ATIVOS detectados: ${ativos.length}`);

    for (const mesa of ativos) {
      const fingerprint = gerarFingerprint(mesa);
      const anterior = ultimoFingerprintPorMesa.get(mesa.mesaId);

      // se for o mesmo comportamento, ignora
      if (anterior === fingerprint) {
        continue;
      }

      // salva o novo comportamento
      ultimoFingerprintPorMesa.set(mesa.mesaId, fingerprint);

      const mesaNome = mesa.mesaNome || mesa.mesaId;
      const link = getMesaLink(mesa.mesaNome);

      const mensagem = `
🟢 SINAL ATIVO (API)

🎰 Mesa: ${mesaNome}
🔢 Último número: ${mesa.ultimoNumero ?? "—"}
🕒 Rodada: ${mesa.rodada ?? "—"}

🎯 Alvos:
${Array.isArray(mesa.alvos) && mesa.alvos.length > 0 ? mesa.alvos.join(" • ") : "—"}

${link ? `🔗 Link da mesa:\n${link}` : "⚠️ Link não encontrado para essa mesa."}
`;

      await bot.sendMessage(CHAT_ID, mensagem);

      console.log(`📣 Enviado: ${mesa.mesaId} (${mesaNome})`);
    }
  } catch (err) {
    console.error("❌ Erro ao consultar Oráculo:", err.message);
  }
}

/* =========================
   LOOP — 2 MINUTOS
========================= */

setInterval(espelharAtivos, 120_000);
console.log("⏱️ Polling configurado: 2 minutos");

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Servidor ativo na porta", PORT);
});
