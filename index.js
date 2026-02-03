import express from "express";
import TelegramBot from "node-telegram-bot-api";

// ============================
// SERVIDOR HTTP
// ============================

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("alive");
});

app.listen(PORT, () => {
  console.log("🌐 Servidor HTTP ativo na porta", PORT);
});

// ============================
// BOT TELEGRAM
// ============================

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN não encontrado");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log("🤖 Bot Telegram iniciado");

// ============================
// /start
// ============================

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🔮 *V27 Oracle online*\n\nUse /teste_sinal para validar envio.",
    { parse_mode: "Markdown" }
  );
});

// ============================
// /teste_sinal
// ============================

bot.onText(/\/teste_sinal/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    "🚨 *SINAL DE TESTE*\n🎯 Mesa: TESTE\n🎲 Último número: 27\n🔥 Alvos: 6 | 29",
    { parse_mode: "Markdown" }
  );

  console.log("✅ sinal de teste enviado para", chatId);
});

// ============================
// LOG DE VIDA
// ============================

setInterval(() => {
  console.log("💓 bot vivo", new Date().toISOString());
}, 60000);
