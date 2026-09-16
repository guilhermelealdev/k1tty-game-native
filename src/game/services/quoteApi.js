// src/game/services/quoteApi.js
const FALLBACK = [
  { text: 'A simplicidade e o ultimo grau de sofisticacao.', author: 'Leonardo da Vinci' },
  { text: 'O que nao me mata me fortalece.', author: 'Nietzsche' },
  { text: 'Conhece-te a ti mesmo.', author: 'Socrates' },
  { text: 'A imaginacao e mais importante que o conhecimento.', author: 'Einstein' },
  { text: 'Penso, logo existo.', author: 'Descartes' },
  { text: 'O unico modo de fazer um excelente trabalho e amar o que voce faz.', author: 'Steve Jobs' },
];

export async function fetchQuote() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const r = await fetch('https://dummyjson.com/quotes/random', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    if (data && data.quote) return { text: data.quote, author: data.author || 'Desconhecido' };
    throw new Error('formato inesperado');
  } catch (e) {
    return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
  }
}