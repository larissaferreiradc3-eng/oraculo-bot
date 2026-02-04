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
   APP
========================= */

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🤖 ORÁCULO BOT ONLINE — MODO ESPELHO");
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
    "🔮 Oráculo em MODO ESPELHO.\nEstou apenas refletindo o que a API enxerga."
  );
});

/* =========================
   ESPELHO DA API
========================= */

const ORACULO_STATUS_URL = `${ORACULO_API_URL}/oraculo/status`;

async function espelharOraculo() {
  try {
    const response = await fetch(ORACULO_STATUS_URL);
    const data = await response.json();

    if (!data || !Array.isArray(data.mesas)) {
      console.log("⚠️ API retornou dados inválidos");
      return;
    }

    console.log(`🪞 ESPELHO: ${data.mesas.length} mesas`);

    for (const mesa of data.mesas) {
      const {
        mesaId,
        mesaNome,
        status,
        ultimoNumero,
        rodada,
        alvos
      } = mesa;

      const mensagem = `
🪞 ESPELHO DA API

🎰 Mesa: ${mesaNome || mesaId}
📌 Status: ${status}
🔢 Último número: ${ultimoNumero ?? "—"}
🕒 Rodada: ${rodada ?? "—"}

🎯 Alvos da API:
${Array.isArray(alvos) && alvos.length > 0 ? alvos.join(" • ") : "—"}
`;

      await bot.sendMessage(CHAT_ID, mensagem);
    }
  } catch (err) {
    console.error("❌ Erro ao espelhar API:", err.message);
  }
}

/* =========================
   LOOP
========================= */

setInterval(espelharOraculo, 60_000);
console.log("🪞 Modo ESPELHO ativo — leitura a cada 1 minuto");

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Servidor ativo na porta", PORT);
});
