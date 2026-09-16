// src/game/services/unlockableAudio.ts
// Hook para musicas de fundo (loop, fade in/out).

import { Audio } from 'expo-av';
import { useEffect, useRef } from 'react';

const ASSETS_READY = false; // mude para true quando tiver assets/music/

let MUSIC: any = {};
if (ASSETS_READY) {
  MUSIC = {
    menu:     require('../../../assets/music/menu.mp3'),
    terminal: require('../../../assets/music/terminal.mp3'),
    good:     require('../../../assets/sounds/good.mp3'),
    loading:  require('../../../assets/sounds/loading.mp3'),
    victory:  require('../../../assets/sounds/victory.mp3'),
  };
}

export function useBackgroundMusic(track: string, volume = 0.2, opts: any = {}) {
  const soundRef = useRef<any>(null);
  const { loop = true, muted = false } = opts;

  useEffect(() => {
    if (!ASSETS_READY || !MUSIC[track]) return;
    let cancelled = false;
    let sound: any = null;

    (async () => {
      try {
        const { sound: s } = await Audio.Sound.createAsync(
          MUSIC[track],
          { shouldPlay: !muted, isLooping: loop, volume: muted ? 0 : volume },
        );
        if (cancelled) { s.unloadAsync().catch(() => {}); return; }
        sound = s;
        soundRef.current = s;
      } catch {}
    })();

    return () => {
      cancelled = true;
      if (sound) { try { sound.unloadAsync(); } catch {} }
      soundRef.current = null;
    };
  }, [track]);

  useEffect(() => {
    const s = soundRef.current;
    if (!s) return;
    s.setVolumeAsync(muted ? 0 : volume).catch(() => {});
    if (muted) s.pauseAsync().catch(() => {});
    else s.playAsync().catch(() => {});
  }, [muted, volume]);

  return soundRef;
}

export function createAudio() { return null; }
export function playUnmuted() { return { stop: () => {}, setMuted: () => {}, isUnmuted: () => false }; }