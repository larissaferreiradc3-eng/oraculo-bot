import express from "express";
import TelegramBot from "node-telegram-bot-api";

// ============================
// SERVIDOR HTTP (ANTI-SLEEP)
// ============================

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.status(200).send("alive");
});

app.listen(PORT, () => {
  console.log("🌐 Servidor HTTP ativo na porta", PORT);
});

// ============================
// BOT TELEGRAM
// ============================

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN não encontrado nas variáveis de ambiente");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, {
  polling: true,
});

console.log("🤖 Bot Telegram iniciado");

// ============================
// LOG DE VIDA
// ============================

setInterval(() => {
  console.log("💓 bot vivo", new Date().toISOString());
}, 60000);
