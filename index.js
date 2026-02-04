import express from "express";
import TelegramBot from "node-telegram-bot-api";

// ============================
// CONFIGURAÇÕES
// ============================

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
const DESTINO_CHAT_ID = process.env.DESTINO_CHAT_ID;

if (!BOT_TOKEN || !RENDER_EXTERNAL_URL || !DESTINO_CHAT_ID) {
  console.error("❌ Variáveis de ambiente faltando");
  process.exit(1);
}

// ============================
// APP EXPRESS
// ============================

const app = express();
app.use(express.json());

// ============================
// ROTA DE VIDA (OBRIGATÓRIA)
// ============================

app.get("/", (req, res) => {
  res.send("API V27 ONLINE");
});

// ============================
// LOG GLOBAL (DIAGNÓSTICO)
// ============================

app.use((req, res, next) => {
  console.log("📥 REQ:", req.method, req.url);
  next();
});

// ============================
// BOT TELEGRAM (WEBHOOK)
// ============================

const bot = new TelegramBot(BOT_TOKEN);

// endpoint secreto do webhook
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;

await bot.setWebHook(`${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`);
console.log("🔗 Webhook registrado");

// recebe updates do Telegram
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ============================
// COMANDO START
// ============================

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🔮 *V27 Oracle online*\n\nSistema ativo.\nAguardando dados da coleta.",
    { parse_mode: "Markdown" }
  );
});

// ============================
// ENDPOINT DE COLETA (TESTE)
// ============================
// ESTE ENDPOINT PRECISA FUNCIONAR
// ANTES DE QUALQUER LÓGICA V27
// ============================

app.post("/coleta", async (req, res) => {
  const { mesa, numero } = req.body;

  if (!mesa || numero === undefined) {
    console.log("❌ Dados inválidos:", req.body);
    return res.status(400).json({ erro: "dados inválidos" });
  }

  console.log("➡️ número recebido:", mesa, numero);

  // ENVIO DE TESTE (TEMPORÁRIO)
  // serve apenas para provar que a rota funciona
  await bot.sendMessage(
    DESTINO_CHAT_ID,
    `🧪 TESTE COLETA\nMesa: ${mesa}\nNúmero: ${numero}`
  );

  res.json({ status: "ok" });
});

// ============================
// START SERVER
// ============================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌐 Servidor ativo na porta", PORT);
});
