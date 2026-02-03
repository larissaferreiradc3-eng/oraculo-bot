import express from "express";
import TelegramBot from "node-telegram-bot-api";

// ============================
// CONFIG
// ============================

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL; 
// o Render injeta essa variável automaticamente

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN não encontrado");
  process.exit(1);
}

if (!RENDER_URL) {
  console.error("❌ RENDER_EXTERNAL_URL não encontrado");
  process.exit(1);
}

// ============================
// APP EXPRESS
// ============================

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// rota de vida
app.get("/", (req, res) => {
  res.send("alive");
});

// ============================
// BOT TELEGRAM (WEBHOOK)
// ============================

const bot = new TelegramBot(BOT_TOKEN);

// endpoint secreto do webhook
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;

// registra webhook no Telegram
await bot.setWebHook(`${RENDER_URL}${WEBHOOK_PATH}`);
console.log("🔗 Webhook registrado:", `${RENDER_URL}${WEBHOOK_PATH}`);

// rota que recebe updates do Telegram
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ============================
// COMANDOS
// ============================

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🔮 *V27 Oracle online*\n\nWebhook ativo.\nSistema estável.\nUse /teste_sinal.",
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/teste_sinal/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🚨 *SINAL DE TESTE*\n🎯 Mesa: TESTE\n🎲 Último número: 27\n🔥 Alvos: 6 | 29",
    { parse_mode: "Markdown" }
  );
});

// ============================
// START SERVER
// ============================

app.listen(PORT, () => {
  console.log("🌐 Servidor HTTP ativo na porta", PORT);
});
