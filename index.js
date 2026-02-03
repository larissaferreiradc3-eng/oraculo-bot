import express from "express";
import TelegramBot from "node-telegram-bot-api";

// ============================
// SERVIDOR HTTP (ANTI-SLEEP)
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
// BOT TELEGRAM (POLLING PURO)
// ============================

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN não encontrado");
  process.exit(1);
}

// 👉 polling direto, sem webhook
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log("🤖 Bot Telegram iniciado (polling puro)");

// ============================
// /start
// ============================

bot.onText(/\/start/, (msg) => {
  console.log("📩 /start recebido de", msg.chat.id);

  bot.sendMessage(
    msg.chat.id,
    "🔮 *V27 Oracle online*\n\nComunicação ativa.\nUse /teste_sinal.",
    { parse_mode: "Markdown" }
  );
});

// ============================
// /teste_sinal
// ============================

bot.onText(/\/teste_sinal/, (msg) => {
  console.log("🚨 /teste_sinal recebido de", msg.chat.id);

  bot.sendMessage(
    msg.chat.id,
    "🚨 *SINAL DE TESTE*\n🎯 Mesa: TESTE\n🎲 Último número: 27\n🔥 Alvos: 6 | 29",
    { parse_mode: "Markdown" }
  );
});

// ============================
// LOG DE VIDA
// ============================

setInterval(() => {
  console.log("💓 bot vivo", new Date().toISOString());
}, 60000);
