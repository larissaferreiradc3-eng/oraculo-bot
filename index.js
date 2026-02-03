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
// BOT TELEGRAM
// ============================

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN não encontrado");
  process.exit(1);
}

// inicia SEM polling automático
const bot = new TelegramBot(BOT_TOKEN, {
  polling: { autoStart: false }
});

// limpa qualquer webhook antigo
(async () => {
  try {
    await bot.deleteWebhook({ drop_pending_updates: true });
    console.log("🧹 Webhook removido com sucesso");

    await bot.startPolling();
    console.log("🤖 Bot Telegram iniciado (polling limpo)");
  } catch (err) {
    console.error("❌ erro ao iniciar bot:", err.message);
  }
})();

// ============================
// /start
// ============================

bot.onText(/\/start/, (msg) => {
  console.log("📩 /start recebido de", msg.chat.id);

  bot.sendMessage(
    msg.chat.id,
    "🔮 *V27 Oracle online*\n\nBot ativo e comunicando.\nUse /teste_sinal.",
    { parse_mode: "Markdown" }
  );
});

// ============================
// /teste_sinal (manual)
// ============================

bot.onText(/\/teste_sinal/, (msg) => {
  console.log("🚨 /teste_sinal acionado por", msg.chat.id);

  bot.sendMessage(
    msg.chat.id,
    "🚨 *SINAL DE TESTE*\n🎯 Mesa: TESTE\n🎲 Último número: 27\n🔥 Alvos: 6 | 29",
    { parse_mode: "Markdown" }
  );
});

// ============================
// TESTE AUTOMÁTICO (FORÇADO)
// ============================

// ⚠️ TROQUE PELO SEU CHAT ID (ou grupo)
const CHAT_ID_TESTE = msg => msg?.chat?.id;

// envia mensagem automática 15s após subir
setTimeout(() => {
  console.log("🧪 executando teste automático de envio");

  // ⚠️ se não souber o chat_id ainda, esse teste serve só pra log
  // depois a gente fixa o ID
}, 15000);

// ============================
// LOG DE VIDA
// ============================

setInterval(() => {
  console.log("💓 bot vivo", new Date().toISOString());
}, 60000);
