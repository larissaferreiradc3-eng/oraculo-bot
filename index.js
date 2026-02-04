import express from "express";
import TelegramBot from "node-telegram-bot-api";

// =====================================================
// CONFIG
// =====================================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
const DESTINO_CHAT_ID = process.env.DESTINO_CHAT_ID;

if (!BOT_TOKEN || !RENDER_EXTERNAL_URL || !DESTINO_CHAT_ID) {
  console.error("❌ Variáveis de ambiente faltando");
  process.exit(1);
}

// =====================================================
// MAPA DE MESAS ORGANIZADO POR PROVEDOR
// =====================================================

const MESAS = {
  PRAGMATIC: {
    "BRASILEIRA PRAGMATIC": "https://www.betano.bet.br/casino/live/games/brazilian-roulette/11354/tables/",
    "AUTO MEGA ROULETTE 0,50": "https://www.betano.bet.br/casino/live/games/auto-mega-roulette/10842/tables/",
    "AUTO ROULETTE 2,50": "https://www.betano.bet.br/casino/live/games/auto-roulette/3502/tables/",
    "MEGA ROULETTE": "https://www.betano.bet.br/casino/live/games/mega-roulette/3523/tables/",
    "MEGA ROULETTE BRAZILIAN": "https://www.betano.bet.br/casino/live/games/mega-roulette-brazilian/17775/tables/",
    "MEGA ROULETTE 3000": "https://www.betano.bet.br/casino/live/games/mega-roulette-3000/31954/tables/",
    "POWER UP ROULETTE": "https://www.betano.bet.br/casino/live/games/powerup-roulette/8193/tables/"
  },

  EVOLUTION: {
    "IMMERSIVE DELUXE": "https://www.betano.bet.br/casino/live/games/immersive-roulette-deluxe/23563/tables/",
    "FRENCH ROULETTE": "https://www.betano.bet.br/casino/live/games/french-roulette-la-partage/25698/tables/",
    "ORION ROULETTE": "https://www.betano.bet.br/casino/live/games/orion-roulette/25636/tables/",
    "VIP ROULETTE": "https://www.betano.bet.br/casino/live/games/vip-roulette/4859/tables/",
    "ROULETTE 1": "https://www.betano.bet.br/casino/live/games/roulette-1/3528/tables/",
    "ROULETTE EXTRA TIME 2": "https://www.betano.bet.br/casino/live/games/roulette-2-extra-time/3527/tables/",
    "ROULETTE ITALIAN TRICOLORE": "https://www.betano.bet.br/casino/live/games/roulette-italia-tricolore/3530/tables/",
    "ROULETTE MACAO": "https://www.betano.bet.br/casino/live/games/roulette-macao/3531/tables/",
    "ROMANIAN ROULETTE": "https://www.betano.bet.br/casino/live/games/romanian-roulette/7632/tables/",
    "RUSSIAN ROULETTE": "https://www.betano.bet.br/casino/live/games/russian-roulette/3532/tables/",
    "TURKISH ROULETTE": "https://www.betano.bet.br/casino/live/games/turkish-roulette/3533/tables/",
    "TURKISH MEGA ROULETTE": "https://www.betano.bet.br/casino/live/games/turkish-mega-roulette/17844/tables/",
    "SPEED ROULETTE": "https://www.betano.bet.br/casino/live/games/speed-roulette-1/3539/tables/",
    "SPEED ROULETTE LATINA": "https://www.betano.bet.br/casino/live/games/speed-roulette-latina/32783/tables/"
  },

  EZUGI: {
    "EZ ROULETTE BRAZIL": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-brazil/15673/",
    "EZ ROULETTE ENGLISH": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-english/15670/",
    "EZ ROULETTE HINDI": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-hindi/25230/",
    "EZ ROULETTE JAPANESE": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-japanese/15671/",
    "EZ ROULETTE LATINA": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-latina/23554/",
    "EZ ROULETTE MANDARIN": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-mandarin/15672/",
    "EZ ROULETTE NEDERLANDS": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-nederlands/25231/",
    "EZ ROULETTE SAVANNA": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-savanna/24258/",
    "EZ ROULETTE THAI": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-thai/15669/",
    "EZ ROULETTE TURKISH": "https://www.betano.bet.br/casino/live/games/ez-dealer-roulette-turkish/21263/",
    "EZ ROULETTE FOOTBALL AUTO": "https://www.betano.bet.br/casino/live/games/football-auto-roulette/15718/tables/",
    "EZ ROULETTE HALLOWEEN AUTO": "https://www.betano.bet.br/casino/live/games/halloween-auto-roulette/31277/tables/",
    "EZ ROULETTE HORSE RACING": "https://www.betano.bet.br/casino/live/games/horse-racing-auto-roulette/23875/tables/",
    "EZ ROULETTE ITALIAN": "https://www.betano.bet.br/casino/live/games/italian-roulette/18591/tables/"
  }
};

// função utilitária: acha provedor + link
function buscarMesa(mesa) {
  for (const provedor of Object.keys(MESAS)) {
    if (MESAS[provedor][mesa]) {
      return { provedor, link: MESAS[provedor][mesa] };
    }
  }
  return { provedor: "DESCONHECIDO", link: "Link não disponível" };
}

// =====================================================
// APP
// =====================================================

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API VORTEX 27 ONLINE");
});

// =====================================================
// BOT TELEGRAM (WEBHOOK)
// =====================================================

const bot = new TelegramBot(BOT_TOKEN);
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;

await bot.setWebHook(`${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`);

app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// =====================================================
// ESTADO POR MESA
// =====================================================

const estadoMesas = {};

// =====================================================
// LÓGICA VORTEX 27 + RESULTADO
// =====================================================

function processarVortex27(mesa, numero) {
  if (!estadoMesas[mesa]) {
    estadoMesas[mesa] = {
      ultimoNumero: null,
      referencia: null,
      ativo: false,
      giros: 0,
      alvo1: null,
      alvo2: null,
      resultadoEnviado: false
    };
  }

  const e = estadoMesas[mesa];

  // WIN / LOSS
  if (e.ativo && !e.resultadoEnviado) {
    if (numero === e.alvo1 || numero === e.alvo2) {
      e.resultadoEnviado = true;
      return { tipo: "WIN", mesa };
    }
    if (e.giros > 7) {
      e.resultadoEnviado = true;
      return { tipo: "LOSS", mesa };
    }
  }

  if (numero === 27) {
    e.ativo = true;
    e.giros = 0;
    e.referencia = e.ultimoNumero;
    e.alvo1 = e.referencia + 2;
    e.alvo2 = e.referencia - 2;
    e.resultadoEnviado = false;
    e.ultimoNumero = numero;
    return null;
  }

  if (!e.ativo) {
    e.ultimoNumero = numero;
    return null;
  }

  e.giros++;

  if (e.giros === 6 || e.giros === 7) {
    return {
      tipo: "SINAL",
      mesa,
      alvo1: e.alvo1,
      alvo2: e.alvo2
    };
  }

  e.ultimoNumero = numero;
  return null;
}

// =====================================================
// COLETA
// =====================================================

app.post("/coleta", async (req, res) => {
  const { mesa, numero } = req.body;
  const evento = processarVortex27(mesa, numero);

  if (evento) {
    const { provedor, link } = buscarMesa(mesa);

    if (evento.tipo === "SINAL") {
      await bot.sendMessage(
        DESTINO_CHAT_ID,
        `🚨 *VORTEX 27 CONFIRMADO*\n\n🏷 Provedor: ${provedor}\n🎯 Mesa: ${mesa}\n🔗 ${link}\n➕ Alvo principal: ${evento.alvo1}\n➖ Alvo secundário: ${evento.alvo2}`,
        { parse_mode: "Markdown" }
      );
    }

    if (evento.tipo === "WIN") {
      await bot.sendMessage(
        DESTINO_CHAT_ID,
        `✅ *WIN CONFIRMADO*\n\n🏷 Provedor: ${provedor}\n🎯 Mesa: ${mesa}\n🔗 ${link}`,
        { parse_mode: "Markdown" }
      );
    }

    if (evento.tipo === "LOSS") {
      await bot.sendMessage(
        DESTINO_CHAT_ID,
        `❌ *LOSS CONFIRMADO*\n\n🏷 Provedor: ${provedor}\n🎯 Mesa: ${mesa}\n🔗 ${link}`,
        { parse_mode: "Markdown" }
      );
    }
  }

  res.json({ status: "ok" });
});

// =====================================================
// START
// =====================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌐 Servidor ativo na porta", PORT);
});
