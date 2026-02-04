import express from "express";
import TelegramBot from "node-telegram-bot-api";

// =====================
// ENV
// =====================
const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

if (!BOT_TOKEN || !RENDER_EXTERNAL_URL) {
  console.error("❌ Variáveis de ambiente faltando");
  process.exit(1);
}

// =====================
// APP
// =====================
const app = express();
app.use(express.json());

// rota raiz (healthcheck)
app.get("/", (req, res) => {
  res.send("🤖 BOT ONLINE");
});

// =====================
// TELEGRAM BOT
// =====================
const bot = new TelegramBot(BOT_TOKEN);
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;
const WEBHOOK_URL = `${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`;

await bot.setWebHook(WEBHOOK_URL);
console.log("✅ Webhook registrado em:", WEBHOOK_URL);

// =====================
// WEBHOOK RECEIVER
// =====================
app.post(WEBHOOK_PATH, (req, res) => {
  console.log("📥 UPDATE RECEBIDO:", JSON.stringify(req.body));

  // 🔥 ESSENCIAL PARA WEBHOOK FUNCIONAR
  bot.processUpdate(req.body);

  res.sendStatus(200);
});

// =====================
// LISTENERS
// =====================
bot.on("message", async (msg) => {
  console.log("💬 MENSAGEM:", msg.text);

  await bot.sendMessage(
    msg.chat.id,
    "🤖 Bot online e respondendo corretamente!"
  );
});

// =====================
// SERVER
// =====================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Servidor ativo na porta", PORT);
});
