import express from "express";
import TelegramBot from "node-telegram-bot-api";

/* =========================
   ENV
========================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN || !RENDER_EXTERNAL_URL || !CHAT_ID) {
  console.error("❌ Variáveis de ambiente faltando");
  process.exit(1);
}

/* =========================
   APP
========================= */

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🤖 ORÁCULO BOT ONLINE");
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

// comandos de conforto / verificação
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🔮 Oráculo online.\nObservando as mesas em silêncio inteligente."
  );
});

bot.onText(/\/status/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🟢 Oráculo ATIVO\n⏱️ Leitura da API a cada 1 minuto\n🤫 Só falo quando faz sentido."
  );
});

/* =========================
   CONTROLE INTERNO
========================= */

// evita sinal duplicado
const mesasJaSinalizadas = new Set();

// endpoint da API interna
const ORACULO_STATUS_URL =
  "https://oraculo-bot-9iyu.onrender.com/oraculo/status";

/* =========================
   FUNÇÃO DE LEITURA DA API
========================= */

async function verificarOraculo() {
  try {
    const response = await fetch(ORACULO_STATUS_URL);
    const data = await response.json();

    if (!data || !Array.isArray(data.mesas)) {
      console.log("⚠️ Oráculo retornou dados inválidos");
      return;
    }

    console.log(
      `👀 Leitura do Oráculo: ${data.mesas.length} mesas analisadas`
    );

    for (const mesa of data.mesas) {
      const {
        mesaId,
        mesaNome,
        status,
        ultimoNumero,
        alvos,
        rodada
      } = mesa;

      // só considera mesas ATIVAS
      if (status !== "ATIVO") continue;

      // gatilho do Vortex 27
      if (ultimoNumero !== 27) continue;

      // evita sinal duplicado
      if (mesasJaSinalizadas.has(mesaId)) continue;

      // precisa ter alvos definidos
      if (!Array.isArray(alvos) || alvos.length === 0) continue;

      const mensagem = `
🎯 SINAL VORTEX 27

🎰 Mesa: ${mesaNome || mesaId}
🧲 Gatilho: 27
🕒 Rodada: ${rodada ?? "?"}

🎯 Alvos:
${alvos.join(" • ")}

⏳ Aguardar 4 giros
🎯 Entrada: 6ª e 7ª
`;

      await bot.sendMessage(CHAT_ID, mensagem);

      mesasJaSinalizadas.add(mesaId);

      console.log(`📣 SINAL ENVIADO → ${mesaId}`);
    }
  } catch (err) {
    console.error("❌ Erro ao consultar Oráculo:", err.message);
  }
}

/* =========================
   LOOP DE VERIFICAÇÃO
========================= */

setInterval(verificarOraculo, 60_000);
console.log("⏱️ Oráculo será verificado a cada 1 minuto");

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Servidor ativo na porta", PORT);
});
