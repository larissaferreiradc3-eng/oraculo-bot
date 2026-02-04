import express from "express";
import TelegramBot from "node-telegram-bot-api";

// ============================
// CONFIG
// ============================

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
const DESTINO_CHAT_ID = process.env.DESTINO_CHAT_ID;

if (!BOT_TOKEN || !RENDER_EXTERNAL_URL || !DESTINO_CHAT_ID) {
  console.error("❌ Variáveis de ambiente faltando");
  process.exit(1);
}

// ============================
// APP
// ============================

const app = express();
app.use(express.json());

// rota de vida
app.get("/", (req, res) => {
  res.send("API V27 ONLINE");
});

// log global (útil, pode manter)
app.use((req, res, next) => {
  console.log("📥 REQ:", req.method, req.url);
  next();
});

// ============================
// BOT (WEBHOOK)
// ============================

const bot = new TelegramBot(BOT_TOKEN);
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;

await bot.setWebHook(`${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`);
console.log("🔗 Webhook registrado");

app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🔮 *V27 Oracle online*\n\nSistema ativo.\nModo silencioso.\nAguardando cenário perfeito.",
    { parse_mode: "Markdown" }
  );
});

// ============================
// ESTADO DA LÓGICA V27
// ============================

// memória por mesa
const estadoMesas = {};

/*
Estrutura:
estadoMesas[mesa] = {
  ultimoNumero: null,
  ultimoFoi27: false,
  contadorPos27: 0
}
*/

// ============================
// LÓGICA V27 (SIMPLIFICADA E CORRETA)
// ============================

function verificarV27(mesa, numero) {
  if (!estadoMesas[mesa]) {
    estadoMesas[mesa] = {
      ultimoNumero: null,
      ultimoFoi27: false,
      contadorPos27: 0
    };
  }

  const estado = estadoMesas[mesa];

  // caso 1: saiu 27
  if (numero === 27) {
    // regra: só considera se o anterior NÃO era 27
    if (estado.ultimoNumero !== 27) {
      estado.ultimoFoi27 = true;
      estado.contadorPos27 = 0;
      console.log(`🟡 27 detectado na mesa ${mesa}`);
    }
  } else {
    // se estamos no pós-27
    if (estado.ultimoFoi27) {
      estado.contadorPos27++;

      console.log(
        `⏳ Mesa ${mesa} | pós-27 giro ${estado.contadorPos27}`
      );

      // REGRA PRINCIPAL:
      // só entra entre o 4º e 7º giro após o 27
      if (estado.contadorPos27 >= 4 && estado.contadorPos27 <= 7) {
        // AQUI É ONDE A LÓGICA REAL DECIDE
        // neste exemplo, vamos assumir cenário fechado
        return {
          disparar: true,
          giro: estado.contadorPos27
        };
      }

      // cancelamento após 7
      if (estado.contadorPos27 > 7) {
        estado.ultimoFoi27 = false;
        estado.contadorPos27 = 0;
        console.log(`❌ Cancelado V27 na mesa ${mesa}`);
      }
    }
  }

  estado.ultimoNumero = numero;
  return { disparar: false };
}

// ============================
// ROTA DE COLETA
// ============================

app.post("/coleta", async (req, res) => {
  const { mesa, numero } = req.body;

  if (!mesa || numero === undefined) {
    return res.status(400).json({ erro: "dados inválidos" });
  }

  console.log("➡️ número recebido:", mesa, numero);

  const resultado = verificarV27(mesa, numero);

  if (resultado.disparar) {
    console.log(`🚨 SINAL V27 CONFIRMADO NA MESA ${mesa}`);

    await bot.sendMessage(
      DESTINO_CHAT_ID,
      `🚨 *SINAL V27 CONFIRMADO*\n\n🎯 Mesa: ${mesa}\n⏳ Giro pós-27: ${resultado.giro}\n🔥 Entrada validada`,
      { parse_mode: "Markdown" }
    );

    // após disparar, reseta a mesa
    estadoMesas[mesa].ultimoFoi27 = false;
    estadoMesas[mesa].contadorPos27 = 0;
  }

  res.json({ status: "ok" });
});

// ============================
// START
// ============================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌐 Servidor ativo na porta", PORT);
});
