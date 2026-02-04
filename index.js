import express from "express";
import TelegramBot from "node-telegram-bot-api";

/* =========================
   ENV
========================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
const CHAT_ID = process.env.CHAT_ID;
const ORACULO_API_URL = process.env.ORACULO_API_URL;

if (!BOT_TOKEN || !RENDER_EXTERNAL_URL || !CHAT_ID || !ORACULO_API_URL) {
  console.error("❌ Variáveis de ambiente faltando");
  process.exit(1);
}

/* =========================
   APP
========================= */

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🤖 ORÁCULO BOT ONLINE");
});

/* =========================
   TELEGRAM
========================= */

const bot = new TelegramBot(BOT_TOKEN);

const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;
const WEBHOOK_URL = `${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`;

await bot.setWebHook(WEBHOOK_URL);
console.log("✅ Webhook Telegram registrado:", WEBHOOK_URL);

app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🔮 Oráculo online.\nAPI detecta gatilhos.\nBot confirma com inteligência."
  );
});

/* =========================
   CONTROLE INTERNO
========================= */

const ORACULO_STATUS_URL = `${ORACULO_API_URL}/oraculo/status`;

// evita sinal duplicado
const mesasSinalizadas = new Set();

// padrões clássicos do 27
const PADROES_27 = [2, 20, 22];

// score mínimo
const SCORE_MINIMO = 4;

/* =========================
   FUNÇÕES DE SCORE
========================= */

function scoreDuzia(numero) {
  if (numero >= 1 && numero <= 24) return 2; // 1ª ou 2ª
  return 0;
}

function scoreHistorico(alvos) {
  if (!Array.isArray(alvos)) return 0;
  return alvos.some(n => PADROES_27.includes(n)) ? 2 : 0;
}

function scoreDistribuicao(alvos) {
  if (!Array.isArray(alvos)) return 0;
  return alvos.length >= 3 ? 1 : 0;
}

/* =========================
   LEITURA + REFINAMENTO
========================= */

async function verificarOraculo() {
  try {
    const response = await fetch(ORACULO_STATUS_URL);
    const data = await response.json();

    if (!data || !Array.isArray(data.mesas)) {
      console.log("⚠️ Oráculo retornou dados inválidos");
      return;
    }

    console.log(`👀 Leitura do Oráculo: ${data.mesas.length} mesas analisadas`);

    for (const mesa of data.mesas) {
      const {
        mesaId,
        mesaNome,
        status,
        ultimoNumero,
        alvos,
        rodada
      } = mesa;

      // API já fez o filtro bruto
      if (status !== "ATIVO") continue;
      if (ultimoNumero !== 27) continue;
      if (mesasSinalizadas.has(mesaId)) continue;

      let score = 0;
      let motivos = [];

      // DÚZIA
      const sDuzia = scoreDuzia(ultimoNumero);
      if (sDuzia > 0) {
        score += sDuzia;
        motivos.push("1ª/2ª dúzia favorável");
      }

      // HISTÓRICO 27
      const sHist = scoreHistorico(alvos);
      if (sHist > 0) {
        score += sHist;
        motivos.push("Histórico positivo do 27");
      }

      // DISTRIBUIÇÃO
      const sDist = scoreDistribuicao(alvos);
      if (sDist > 0) {
        score += sDist;
        motivos.push("Alvos bem distribuídos");
      }

      // DECISÃO
      if (score < SCORE_MINIMO) {
        console.log(`❌ Mesa ${mesaId} ignorada (score ${score})`);
        continue;
      }

      const mensagem = `
🎯 SINAL VORTEX 27

🎰 Mesa: ${mesaNome || mesaId}
🧲 Gatilho detectado pela API
📊 Score de confirmação: ${score}

📌 Motivos:
${motivos.map(m => `• ${m}`).join("\n")}

🎯 Alvos:
${alvos.join(" • ")}

⏳ Aguardar 4 giros
🎯 Entrada: 6ª e 7ª
`;

      await bot.sendMessage(CHAT_ID, mensagem);

      mesasSinalizadas.add(mesaId);
      console.log(`📣 SINAL CONFIRMADO → ${mesaId}`);
    }
  } catch (err) {
    console.error("❌ Erro ao consultar Oráculo:", err.message);
  }
}

/* =========================
   LOOP
========================= */

setInterval(verificarOraculo, 60_000);
console.log("⏱️ Oráculo será verificado a cada 1 minuto");

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Servidor ativo na porta", PORT);
});
