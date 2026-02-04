import express from "express";
import TelegramBot from "node-telegram-bot-api";

/* =========================
   ENV
========================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN || !RENDER_EXTERNAL_URL || !CHAT_ID) {
  console.error("❌ Variáveis de ambiente faltando");
  process.exit(1);
}

/* =========================
   CONFIG
========================= */

const ORACULO_STATUS_URL =
  "https://oraculo-bot-9iyu.onrender.com/oraculo/status";

const POLLING_INTERVAL = 120000; // 2 minutos

/* =========================
   LINKS DAS MESAS
========================= */

const MESA_LINKS_BY_NAME = {
  "BRASILEIRA PRAGMATIC": "https://www.betano.bet.br/casino/live/games/brazilian-roulette/11354/tables/",
  "AUTO MEGA ROULETTE 0,50": "https://www.betano.bet.br/casino/live/games/auto-mega-roulette/10842/tables/",
  "AUTO ROULETTE 2,50": "https://www.betano.bet.br/casino/live/games/auto-roulette/3502/tables/",
  "DEUTSCHE ROULETTE 2,50": "https://www.betano.bet.br/casino/live/games/deutsche-roulette/3529/tables/",
  "FRENCH ROULLETE": "https://www.betano.bet.br/casino/live/games/french-roulette-la-partage/25698/tables/",
  "IMMERSIVE DELUXE": "https://www.betano.bet.br/casino/live/games/immersive-roulette-deluxe/23563/tables/",
  "MEGA ROULETTE": "https://www.betano.bet.br/casino/live/games/mega-roulette/3523/tables/",
  "MEGA ROULETTE BRAZILIAN": "https://www.betano.bet.br/casino/live/games/mega-roulette-brazilian/17775/tables/",
  "ORION ROULLETE": "https://www.betano.bet.br/casino/live/games/orion-roulette/25636/tables/",
  "POWER UP ROULETTE": "https://www.betano.bet.br/casino/live/games/powerup-roulette/8193/tables/",
  "ROMANIAN ROULETTE": "https://www.betano.bet.br/casino/live/games/romanian-roulette/7632/tables/",
  "ROULETTE 1": "https://www.betano.bet.br/casino/live/games/roulette-1/3528/tables/",
  "ROULETTW EXTRA TIME2": "https://www.betano.bet.br/casino/live/games/roulette-2-extra-time/3527/tables/",
  "ROULETTE ITALIAN TRICOLORE": "https://www.betano.bet.br/casino/live/games/roulette-italia-tricolore/3530/tables/",
  "ROULETTE LATINA2": "https://www.betano.bet.br/casino/live/games/roulette-latina/8192/tables/",
  "ROULETTE MACAO": "https://www.betano.bet.br/casino/live/games/roulette-macao/3531/tables/",
  "RUSSIAN ROULETTE": "https://www.betano.bet.br/casino/live/games/russian-roulette/3532/tables/",
  "SPEED ROULETTE": "https://www.betano.bet.br/casino/live/games/speed-roulette-1/3539/tables/",
  "SPEED ROULETTE LATINA": "https://www.betano.bet.br/casino/live/games/speed-roulette-latina/32783/tables/",
  "TURKISH MEGA ROULETTE": "https://www.betano.bet.br/casino/live/games/turkish-mega-roulette/17844/tables/",
  "TURKISH ROULETTE": "https://www.betano.bet.br/casino/live/games/turkish-roulette/3533/tables/",
  "VIP ROULETTE": "https://www.betano.bet.br/casino/live/games/vip-roulette/4859/tables/",
  "MEGA ROULETTE 3000": "https://www.betano.bet.br/casino/live/games/mega-roulette-3000/31954/tables/"
};

/* =========================
   HELPERS
========================= */

function normalizarNome(nome) {
  if (!nome) return "";
  return nome.toString().trim().toUpperCase().replace(/\s+/g, " ");
}

function getMesaLink(mesaNome) {
  const nomeNormalizado = normalizarNome(mesaNome);

  for (const key of Object.keys(MESA_LINKS_BY_NAME)) {
    if (normalizarNome(key) === nomeNormalizado) {
      return MESA_LINKS_BY_NAME[key];
    }
  }

  return null;
}

function isNumeroBloco2(n) {
  const bloco2 = new Set([
    2, 12, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 32
  ]);
  return bloco2.has(n);
}

/* =========================
   ESTADO GLOBAL DO BOT
========================= */

// anti repetição geral
const fingerprintMesa = new Map();

// estado de execução do gatilho 27 por mesa
const estado27 = new Map();

/*
estado27:
{
  ativo: true,
  gatilhoIndex: index do 27 na timeline,
  numeroAnterior27: X,
  alvos: [..],
  aguardandoRodadas: N,
  fase: "OBSERVACAO" | "ESPERA" | "ENTRADA" | "FINALIZADO" | "CANCELADO",
  criadoEm: timestamp,
  rodadaInicial: valor da rodada recebida,
  enviadoSinal: false,
  enviadosAcompanhamentos: Set
}
*/

/* =========================
   TELEGRAM + EXPRESS
========================= */

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🤖 ORÁCULO BOT EXECUTOR 27 ONLINE");
});

const bot = new TelegramBot(BOT_TOKEN);

const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;
const WEBHOOK_URL = `${RENDER_EXTERNAL_URL}${WEBHOOK_PATH}`;

await bot.setWebHook(WEBHOOK_URL);
console.log("✅ Webhook Telegram registrado:", WEBHOOK_URL);

app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "🔮 Oráculo Bot Executor 27 ativo.\n⏱️ Polling: 2 minutos.\n🟢 Apenas sinais ATIVOS.\n🎯 Execução automática do Gatilho 27."
  );
});

/* =========================
   DETECTAR SATURAÇÃO BLOCO 2
========================= */

function saturacaoBloco2(timeline) {
  if (!Array.isArray(timeline)) return false;

  const ult5 = timeline.slice(0, 5);
  const contBloco2 = ult5.filter(isNumeroBloco2).length;

  return contBloco2 >= 3;
}

/* =========================
   GERAR FINGERPRINT DO EVENTO
========================= */

function gerarFingerprint(mesa) {
  return JSON.stringify({
    status: mesa.status ?? null,
    ultimoNumero: mesa.ultimoNumero ?? null,
    rodada: mesa.rodada ?? null,
    timeline: Array.isArray(mesa.timeline) ? mesa.timeline.slice(0, 10) : []
  });
}

/* =========================
   LÓGICA DO GATILHO 27
========================= */

function detectarGatilho27(timeline) {
  if (!Array.isArray(timeline)) return null;

  const idx = timeline.indexOf(27);
  if (idx === -1) return null;

  // precisa ter anterior ao 27
  if (idx + 1 >= timeline.length) return null;

  const numeroAnterior = timeline[idx + 1];
  if (typeof numeroAnterior !== "number") return null;

  const alvo1 = numeroAnterior - 2;
  const alvo2 = numeroAnterior + 2;

  return {
    idx27: idx,
    numeroAnterior,
    alvos: [alvo1, alvo2].filter(n => n >= 0 && n <= 36)
  };
}

/* =========================
   CANCELAMENTO POR REGRAS
========================= */

function deveCancelarAntesEntrada(timeline) {
  if (!Array.isArray(timeline)) return false;

  // regra: antes da 5 rodada não pode vir 0 ou 27 (difícil pagar)
  const ult5 = timeline.slice(0, 5);
  if (ult5.includes(0) || ult5.includes(27)) {
    return true;
  }

  // saturação bloco2 forte
  if (saturacaoBloco2(timeline)) {
    return true;
  }

  return false;
}

/* =========================
   FUNÇÃO DE MENSAGEM
========================= */

async function enviarMensagemGatilho27(mesa, estado, etapa) {
  const mesaNome = mesa.mesaNome || mesa.mesaId;
  const link = getMesaLink(mesa.mesaNome);

  let titulo = "";
  if (etapa === "ATIVACAO") titulo = "🟢 GATILHO 27 DETECTADO";
  if (etapa === "ENTRADA") titulo = "🎯 ENTRADA CONFIRMADA — GATILHO 27";
  if (etapa === "CANCELADO") titulo = "⛔ ENTRADA CANCELADA — GATILHO 27";
  if (etapa === "GREEN") titulo = "✅ GREEN — GATILHO 27";
  if (etapa === "LOSS") titulo = "❌ LOSS — GATILHO 27";
  if (etapa === "ACOMPANHAMENTO") titulo = "👀 ACOMPANHAMENTO — GATILHO 27";

  const msg = `
${titulo}

🎰 Mesa: ${mesaNome}
🔢 Último número: ${mesa.ultimoNumero ?? "—"}
🕒 Rodada API: ${mesa.rodada ?? "—"}

📌 Número anterior ao 27: ${estado.numeroAnterior27}
🎯 Alvos: ${estado.alvos.join(" / ")}

📍 Fase atual: ${estado.fase}
⏳ Rodadas aguardadas: ${estado.aguardandoRodadas}

${link ? `🔗 Link da mesa:\n${link}` : "⚠️ Link não encontrado para essa mesa."}
`;

  await bot.sendMessage(CHAT_ID, msg);
}

/* =========================
   PROCESSAR MESA
========================= */

async function processarMesa(mesa) {
  if (!mesa || mesa.status !== "ATIVO") return;

  const mesaId = mesa.mesaId;
  const timeline = Array.isArray(mesa.timeline) ? mesa.timeline : [];

  if (!mesaId) return;

  // anti repetição básica (pra não floodar)
  const fingerprint = gerarFingerprint(mesa);
  const anterior = fingerprintMesa.get(mesaId);

  if (anterior === fingerprint) {
    return;
  }

  fingerprintMesa.set(mesaId, fingerprint);

  // se já existe estado 27 ativo
  let st = estado27.get(mesaId);

  // se não existe, tenta detectar gatilho
  if (!st) {
    const gatilho = detectarGatilho27(timeline);
    if (!gatilho) return;

    st = {
      ativo: true,
      numeroAnterior27: gatilho.numeroAnterior,
      alvos: gatilho.alvos,
      aguardandoRodadas: 4, // espera obrigatória
      fase: "ESPERA",
      criadoEm: Date.now(),
      rodadaInicial: mesa.rodada ?? null,
      enviadoSinal: false,
      enviadosAcompanhamentos: new Set(),
      finalizado: false
    };

    estado27.set(mesaId, st);

    await enviarMensagemGatilho27(mesa, st, "ATIVACAO");
    return;
  }

  // se já cancelou/finalizou não faz nada
  if (st.fase === "FINALIZADO" || st.fase === "CANCELADO") return;

  // decrementa espera se o número mudou
  if (st.aguardandoRodadas > 0) {
    st.aguardandoRodadas -= 1;

    // cancelamento na fase de espera
    if (deveCancelarAntesEntrada(timeline)) {
      st.fase = "CANCELADO";
      await enviarMensagemGatilho27(mesa, st, "CANCELADO");
      return;
    }

    // acompanhamento opcional
    if (st.aguardandoRodadas === 2) {
      st.fase = "OBSERVACAO";
      await enviarMensagemGatilho27(mesa, st, "ACOMPANHAMENTO");
    }

    return;
  }

  // chegou fase de entrada (6ª e 7ª)
  if (!st.enviadoSinal) {
    st.fase = "ENTRADA";
    st.enviadoSinal = true;

    await enviarMensagemGatilho27(mesa, st, "ENTRADA");
    return;
  }

  // depois do sinal, verifica se bateu alvo (GREEN)
  const ultimo = mesa.ultimoNumero;

  if (st.alvos.includes(ultimo)) {
    st.fase = "FINALIZADO";
    await enviarMensagemGatilho27(mesa, st, "GREEN");
    return;
  }

  // se passou 2 rodadas após entrada sem bater, LOSS
  if (!st.contadorEntrada) st.contadorEntrada = 0;
  st.contadorEntrada += 1;

  if (st.contadorEntrada >= 2) {
    st.fase = "FINALIZADO";
    await enviarMensagemGatilho27(mesa, st, "LOSS");
    return;
  }
}

/* =========================
   LOOP PRINCIPAL
========================= */

async function loopOraculo() {
  try {
    const response = await fetch(ORACULO_STATUS_URL);
    const data = await response.json();

    if (!data || !Array.isArray(data.mesas)) {
      console.log("⚠️ Oráculo retornou dados inválidos");
      return;
    }

    const ativos = data.mesas.filter(m => m.status === "ATIVO");

    console.log(`👀 Leitura do Oráculo: ${ativos.length} mesas analisadas`);

    for (const mesa of ativos) {
      await processarMesa(mesa);
    }
  } catch (err) {
    console.error("❌ Erro ao consultar Oráculo:", err.message);
  }
}

/* =========================
   START LOOP
========================= */

setInterval(loopOraculo, POLLING_INTERVAL);
console.log("⏱️ Oráculo será verificado a cada 2 minutos");

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Servidor ativo na porta", PORT);
});
