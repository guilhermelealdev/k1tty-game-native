// src/game/services/uiSounds.ts
// Audio UI com expo-av.
//
// IMPORTANTE: para ativar, copie os arquivos .mp3 do projeto web
// para assets/sounds/ e mude ASSETS_READY para true.

import { Audio } from 'expo-av';

const ASSETS_READY = false; // <-- mude para true depois de copiar os assets

let SRC: any = {};
if (ASSETS_READY) {
  SRC = {
    hover:    require('../../../assets/sounds/hover.mp3'),
    selected: require('../../../assets/sounds/selected.mp3'),
    open:     require('../../../assets/sounds/open.mp3'),
    meow:     require('../../../assets/sounds/meow.mp3'),
  };
}

const VOLUMES: Record<string, number> = {
  hover: 0.15, selected: 0.25, open: 0.30, meow: 0.35,
};

const cache: Record<string, any> = {};
let loaded = false;
let muted = false;

export async function preloadSounds() {
  if (loaded || !ASSETS_READY) return;
  loaded = true;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  } catch {}
  for (const key of Object.keys(SRC)) {
    try {
      const { sound } = await Audio.Sound.createAsync(SRC[key], { volume: VOLUMES[key] || 0.2 });
      cache[key] = sound;
    } catch (e) { /* ignora */ }
  }
}

export function setSoundsMuted(m: boolean) { muted = m; }
export function isSoundsMuted() { return muted; }

async function play(key: string) {
  if (muted || !ASSETS_READY) return;
  const s = cache[key];
  if (!s) return;
  try {
    await s.replayAsync();
  } catch {}
}

export function playHover()    { play('hover'); }
export function playSelected() { play('selected'); }
export function playOpen()     { play('open'); }
export function playMeow()     { play('meow'); }

// Fallback no-op se AudioContext nao disponivel
export async function unlockUiSounds() {
  await preloadSounds();
}