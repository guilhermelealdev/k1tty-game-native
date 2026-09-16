// src/game/components/BootScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import { tapLight } from '../services/haptics';

const ASSETS_READY = false;
let LOADING_MP3: any = null;
if (ASSETS_READY) {
  try { LOADING_MP3 = require('../../../assets/sounds/loading.mp3'); } catch {}
}

const LINES = [
  'k1tty BIOS v1.0.0 - (C) 2025 k1tty Systems',
  'Verificando memoria..................... 16384 MB OK',
  'Detectando perifericos.................. OK',
  '',
  'k1tty Linux 1.0.0 (k1tty)',
  '',
  '[*] Iniciando kernel.................... OK',
  '[*] Carregando modulos (gato, ronronar). OK',
  '[*] Montando sistema de arquivos........ OK',
  '[*] Iniciando servicos de rede.......... OK',
  '[*] Carregando perfil do usuario........ OK',
  '[*] Inicializando terminal.............. OK',
  '',
  'Bem-vindo ao k1tty!',
];

export default function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [n, setN] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const soundRef = useRef<any>(null);

  useEffect(() => {
    if (!LOADING_MP3) return;
    let cancelled = false;
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          LOADING_MP3, { shouldPlay: true, isLooping: true, volume: 0.2 }
        );
        if (cancelled) { sound.unloadAsync().catch(() => {}); return; }
        soundRef.current = sound;
      } catch {}
    })();
    return () => {
      cancelled = true;
      if (soundRef.current) { try { soundRef.current.unloadAsync(); } catch {} }
    };
  }, []);

  useEffect(() => {
    if (n >= LINES.length) {
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN(v => v + 1), 180);
    return () => clearTimeout(t);
  }, [n, onComplete]);

  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [n]);

  const skip = () => { tapLight(); onComplete(); };

  return (
    <Pressable onPress={skip} style={styles.container}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        {LINES.slice(0, n).map((l, i) => (
          <Text key={i} style={styles.line}>{l}</Text>
        ))}
        {n < LINES.length && <Text style={styles.cursor}>{'\u2588'}</Text>}
      </ScrollView>
      <Text style={styles.skip}>toque para pular</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 80 },
  line: { color: '#C7EF00', fontFamily: 'monospace', fontSize: 11, lineHeight: 16 },
  cursor: { color: '#C7EF00', fontSize: 11 },
  skip: {
    position: 'absolute', bottom: 24, right: 24,
    color: '#5a7a5a', fontFamily: 'monospace', fontSize: 9,
  },
});