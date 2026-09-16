// src/game/services/catFactApi.js
const FALLBACK = [
  'Gatos passam cerca de 70% da vida dormindo.',
  'Um gato tem 32 musculos em cada orelha.',
  'Gatos nao conseguem sentir o gosto doce.',
  'O nariz de um gato e unico, como uma digital.',
  'Gatos podem saltar ate 6 vezes a propria altura.',
  'Um grupo de gatos e chamado de "clowder".',
  'Gatos ronronam numa frequencia que ajuda a curar ossos.',
  'Gatos tem 230 ossos - humanos tem 206.',
  'O cerebro de um gato e 90% similar ao de um humano.',
];

export async function fetchCatFact() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const r = await fetch('https://catfact.ninja/fact', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    if (data && data.fact) return data.fact;
    throw new Error('formato inesperado');
  } catch (e) {
    return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
  }
}