// src/game/state/storage.ts
// Cache sincrono em memoria sobre AsyncStorage.
// Permite que o reducer leia saves de forma sincrona (igual ao web).

import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVES_KEY = 'k1tty_saves_native';

let cache: Record<string, any> | null = null;
let loadPromise: Promise<void> | null = null;

export async function ensureLoaded(): Promise<void> {
  if (cache !== null) return;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVES_KEY);
      cache = JSON.parse(raw || '{}');
    } catch {
      cache = {};
    }
  })();
  await loadPromise;
}

export function getSaveSync(slot: string): any | null {
  if (!cache) return null;
  return cache[slot] || null;
}

export function getAllSavesSync(): Record<string, any> {
  return cache || {};
}

export function setSaveSync(slot: string, data: any): void {
  if (!cache) cache = {};
  cache[slot] = data;
  AsyncStorage.setItem(SAVES_KEY, JSON.stringify(cache)).catch(() => {});
}

export function deleteSaveSync(slot: string): void {
  if (!cache) return;
  delete cache[slot];
  AsyncStorage.setItem(SAVES_KEY, JSON.stringify(cache)).catch(() => {});
}

export function clearAllSaves(): void {
  cache = {};
  AsyncStorage.removeItem(SAVES_KEY).catch(() => {});
}

export async function persistNow(): Promise<void> {
  if (!cache) return;
  try {
    await AsyncStorage.setItem(SAVES_KEY, JSON.stringify(cache));
  } catch {}
}