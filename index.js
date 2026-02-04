import express from "express";
import TelegramBot from "node-telegram-bot-api";

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

if (!BOT_TOKEN || !RENDER_EXTERNAL_URL) {
  console.error("❌ Variáveis de ambiente faltando");
  process.exit(1);
}

const app = express();
app.use(express.json());

// rota raiz
app.get("/", (req, res) => {
  res.send("BOT ONLINE");
});

const bot = new TelegramBot(BOT_TOKEN);
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;

await bot.setWebHook(`${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`);
console.log("✅ Webhook registrado em:", `${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`);

// 🔥 rota de webhook COM resposta imediata
app.post(WEBHOOK_PATH, (req, res) => {
  console.log("📥 UPDATE RECEBIDO:", JSON.stringify(req.body));
  res.sendStatus(200); // responde IMEDIATO
});

// listener simples
bot.on("message", (msg) => {
  console.log("💬 MENSAGEM:", msg.text);
  bot.sendMessage(msg.chat.id, "🤖 BOT RESPONDEU");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor ativo na porta", PORT);
});
