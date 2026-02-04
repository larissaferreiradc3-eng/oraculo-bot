import express from "express";
import TelegramBot from "node-telegram-bot-api";

// ============================
// CONFIG
// ============================

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
const DESTINO_CHAT_ID = process.env.DESTINO_CHAT_ID;

if (!BOT_TOKEN || !RENDER_URL || !DESTINO_CHAT_ID) {
  console.error("❌ Variáveis de ambiente faltando");
  process.exit(1);
}

// ============================
// CONSTANTES V27
// ============================

const BLOCO_2 = new Set([
  2,12,20,21,22,23,24,25,26,27,28,29,32
]);

// ============================
// ESTADO POR MESA
// ============================

const mesas = {};

// ============================
// APP + BOT
// ============================

const app = express();
app.use(express.json());

const bot = new TelegramBot(BOT_TOKEN);

// webhook
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;
await bot.setWebHook(`${RENDER_URL}${WEBHOOK_PATH}`);
console.log("🔗 Webhook registrado");

// recebe updates do Telegram
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ============================
// COMANDO START
// ============================

bot.onText(/\/start/, (msg) => {
  console.log("📩 /start recebido");

  bot.sendMessage(
    msg.chat.id,
    "🔮 *V27 Oracle online*\n\nLógica V27 ativa.\nLogs habilitados.",
    { parse_mode: "Markdown" }
  );
});

// ============================
// ENDPOINT DO COLETOR
// ============================
// POST /coleta
// { mesa, numero }

app.post("/coleta", async (req, res) => {
  const { mesa, numero } = req.body;

  console.log("➡️ número recebido:", mesa, numero);

  if (!mesa || numero === undefined) {
    console.log("❌ dados inválidos");
    return res.status(400).json({ erro: "dados inválidos" });
  }

  if (!mesas[mesa]) {
    mesas[mesa] = {
      historico: [],
      estadoV27: null
    };
    console.log("🆕 mesa criada:", mesa);
  }

  const estado = mesas[mesa];
  estado.historico.push(numero);

  if (estado.historico.length > 10) {
    estado.historico.shift();
  }

  // ============================
  // DETECÇÃO DO 27
  // ============================

  const h = estado.historico;

  if (numero === 27 && h.length >= 2) {
    const anterior = h[h.length - 2];

    console.log("🟡 27 detectado | anterior:", anterior);

    if (anterior <= 24) {
      const refMenos = anterior - 2;
      const refMais = anterior + 2;

      const alvos = [refMenos, refMais].filter(n =>
        BLOCO_2.has(n)
      );

      if (alvos.length > 0) {
        estado.estadoV27 = {
          aguardando: true,
          girosDesde27: 0,
          alvos,
          sinalEnviado: false
        };

        console.log("🟢 V27 armado | alvos:", alvos);
      } else {
        console.log("🔴 V27 descartado | fora do bloco 2");
      }
    } else {
      console.log("🔴 V27 descartado | dúzia inválida");
    }
  }

  // ============================
  // CONTROLE DE GIROS
  // ============================

  if (estado.estadoV27?.aguardando) {
    estado.estadoV27.girosDesde27++;
    console.log(
      `⏳ aguardando giros ${estado.estadoV27.girosDesde27}/4`
    );

    if (
      estado.estadoV27.girosDesde27 === 4 &&
      !estado.estadoV27.sinalEnviado
    ) {
      console.log("🚨 SINAL AUTORIZADO");

      await bot.sendMessage(
        DESTINO_CHAT_ID,
        `
🚨 *SINAL V27 DETECTADO*
🎯 *Mesa:* ${mesa}
🎲 *Último número:* 27
🔥 *Alvos:* ${estado.estadoV27.alvos.join(" | ")}

⏳ *Entrada após 4 giros*
        `,
        { parse_mode: "Markdown" }
      );

      estado.estadoV27.sinalEnviado = true;
      console.log("✅ sinal enviado");
    }

    if (estado.estadoV27.girosDesde27 > 7) {
      console.log("🛑 V27 expirado");
      estado.estadoV27 = null;
    }
  }

  res.json({ status: "ok" });
});

// ============================
// START SERVER
// ============================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌐 Servidor ativo na porta", PORT);
});
