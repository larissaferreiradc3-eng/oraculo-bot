import express from "express";
import TelegramBot from "node-telegram-bot-api";

// ============================
// CONFIG
// ============================

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;

// 🔴 TROQUE PELO SEU CHAT ID (por enquanto DM)
// depois a gente muda pra grupo
const DESTINO_CHAT_ID = process.env.DESTINO_CHAT_ID;

if (!BOT_TOKEN || !RENDER_URL || !DESTINO_CHAT_ID) {
  console.error("❌ Variáveis de ambiente faltando");
  process.exit(1);
}

// ============================
// APP EXPRESS
// ============================

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("alive");
});

// ============================
// BOT TELEGRAM (WEBHOOK)
// ============================

const bot = new TelegramBot(BOT_TOKEN);

// endpoint secreto do webhook
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;

// registra webhook
await bot.setWebHook(`${RENDER_URL}${WEBHOOK_PATH}`);
console.log("🔗 Webhook registrado:", `${RENDER_URL}${WEBHOOK_PATH}`);

// recebe updates do Telegram
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ============================
// COMANDOS BÁSICOS
// ============================

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🔮 *V27 Oracle online*\n\nSinais reais ativados.\nAguardando gatilhos...",
    { parse_mode: "Markdown" }
  );
});

// ============================
// 🚨 ENDPOINT DE SINAL REAL
// ============================
// SUA API VAI CHAMAR ISSO

app.post("/sinal", async (req, res) => {
  try {
    const { mesa, ultimo_numero, alvos } = req.body;

    if (!mesa || ultimo_numero === undefined || !alvos) {
      return res.status(400).json({ erro: "dados incompletos" });
    }

    const mensagem = `
🚨 *SINAL DETECTADO*
🎯 *Mesa:* ${mesa}
🎲 *Último número:* ${ultimo_numero}
🔥 *Alvos:* ${alvos.join(" | ")}
    `;

    await bot.sendMessage(DESTINO_CHAT_ID, mensagem, {
      parse_mode: "Markdown"
    });

    console.log("✅ sinal enviado:", mesa, ultimo_numero, alvos);

    res.json({ status: "sinal enviado" });
  } catch (err) {
    console.error("❌ erro ao enviar sinal:", err.message);
    res.status(500).json({ erro: "falha interna" });
  }
});

// ============================
// START SERVER
// ============================

app.listen(PORT, () => {
  console.log("🌐 Servidor HTTP ativo na porta", PORT);
});
