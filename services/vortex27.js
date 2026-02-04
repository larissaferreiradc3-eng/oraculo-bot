export function analisarVortex27(historico) {
  const len = historico.length;
  if (len < 2) return null;

  const ultimo = historico[len - 1];
  const anterior = historico[len - 2];

  if (ultimo !== 27) return null;

  // 27 válido só se veio após 1ª ou 2ª dúzia
  if (anterior >= 25) return null;

  const ref = anterior;

  const alvos = [
    ref - 2,
    ref + 2,
    27
  ].filter(n => n >= 0 && n <= 36);

  return {
    gatilho: 27,
    rodadaGatilho: len,
    alvos
  };
}
