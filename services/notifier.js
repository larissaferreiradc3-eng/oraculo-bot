const CHAT_ID = process.env.CHAT_ID;

export async function enviarSinal({ mesa, link, sinal, bot }) {
  const msg = `
🎯 SINAL VORTEX 27

🎰 Mesa: ${mesa}
🔗 Link: ${link}

🧲 Gatilho: ${sinal.gatilho}
🎯 Alvos: ${sinal.alvos.join(" • ")}

⏳ Aguardar 4 giros
🎯 Entrada: rodadas 6–7
`;

  await bot.sendMessage(CHAT_ID, msg);
}

export async function enviarResultado({ mesa, resultado, numero, rodada, bot }) {
  const msg =
    resultado === "GREEN"
      ? `✅ GREEN\nMesa: ${mesa}\nNúmero: ${numero}\nRodada: ${rodada}`
      : `❌ LOSS\nMesa: ${mesa}\nEncerrado na rodada ${rodada}`;

  await bot.sendMessage(CHAT_ID, msg);
}
