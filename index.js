import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { processarEvento } from "./services/monitor.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

if (!BOT_TOKEN || !RENDER_EXTERNAL_URL) {
  console.error("❌ Variáveis de ambiente faltando");
  process.exit(1);
}

const app = express();
app.use(express.json());

// healthcheck
app.get("/", (req, res) => {
  res.send("🤖 ORÁCULO ONLINE");
});

const bot = new TelegramBot(BOT_TOKEN);
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;
const WEBHOOK_URL = `${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`;

await bot.setWebHook(WEBHOOK_URL);
console.log("✅ Webhook Telegram registrado:", WEBHOOK_URL);

// webhook telegram
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 🔥 endpoint de coleta (1 giro real)
app.post("/coleta", async (req, res) => {
  const { mesa, numero } = req.body;

  if (!mesa || typeof numero !== "number") {
    return res.status(400).json({ error: "payload inválido" });
  }

  await processarEvento({ mesa, numero, bot });
  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Servidor ativo na porta", PORT);
});
