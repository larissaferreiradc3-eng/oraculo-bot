import { analisarVortex27 } from "./vortex27.js";
import { enviarSinal, enviarResultado } from "./notifier.js";

// 🔗 LINKS DAS MESAS (VOCÊ VAI PREENCHER DEPOIS)
const LINKS_MESAS = {
  // "MEGA ROULETTE": "https://link-da-mesa",
};

const mesas = {};

export async function processarEvento({ mesa, numero, bot }) {
  if (!mesas[mesa]) {
    mesas[mesa] = {
      historico: [],
      ativo: null
    };
  }

  const estado = mesas[mesa];
  estado.historico.push(numero);

  // se não há sinal ativo, verifica gatilho
  if (!estado.ativo) {
    const sinal = analisarVortex27(estado.historico);
    if (sinal) {
      estado.ativo = {
        ...sinal,
        contador: 0
      };

      await enviarSinal({
        mesa,
        link: LINKS_MESAS[mesa] || "link não informado",
        sinal,
        bot
      });
    }
    return;
  }

  // controla rodadas após sinal
  estado.ativo.contador++;

  if (estado.ativo.contador < 5) return;

  if (estado.ativo.contador <= 7) {
    if (estado.ativo.alvos.includes(numero)) {
      await enviarResultado({
        mesa,
        resultado: "GREEN",
        numero,
        rodada: estado.ativo.contador,
        bot
      });
      estado.ativo = null;
    }
    return;
  }

  await enviarResultado({
    mesa,
    resultado: "LOSS",
    numero: null,
    rodada: estado.ativo.contador,
    bot
  });

  estado.ativo = null;
}
