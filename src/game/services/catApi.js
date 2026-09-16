// src/game/services/catApi.js
const API = 'https://api.thecatapi.com/v1/images/search';

export async function fetchCatImage() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const r = await fetch(API + '?limit=1&order=RANDOM&_=' + Date.now(), { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    return data && data[0] ? data[0].url : null;
  } catch (e) {
    return null;
  }
}