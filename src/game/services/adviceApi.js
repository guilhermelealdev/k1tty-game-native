// src/game/services/adviceApi.js
const FALLBACK = [
  'Nao confie em um gato que nao pisca.',
  'Se o terminal nao responde, ele esta pensando. Ou voce.',
  'Nem todo arquivo quer ser aberto. Respeite o NAO ABRA.',
  'Curiosidade matou o gato. Mas a informacao o trouxe de volta.',
  'Sempre faca backup. Sempre.',
  'rm -rf nunca e a resposta. Exceto quando e.',
  'Todo sistema e uma casa mal-assombrada de decisoes antigas.',
  'O melhor firewall e desligar o cabo.',
];

export async function fetchAdvice() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const r = await fetch('https://api.adviceslip.com/advice?_=' + Date.now(), { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    if (data && data.slip && data.slip.advice) return data.slip.advice;
    throw new Error('formato inesperado');
  } catch (e) {
    return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
  }
}