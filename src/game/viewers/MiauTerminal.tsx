// src/game/viewers/MiauTerminal.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useGame } from '../state/GameContext';
import { useTheme } from '../theme/ThemeContext';
import SpriteAvatar from '../components/SpriteAvatar';

const LOGS = [
  'removendo /home/k1tty/Documents...',
  'removendo /home/k1tty/Music...',
  'removendo /home/k1tty/Pictures...',
  'removendo /home/k1tty/.notes.txt...',
  'removendo /etc/logo.txt...',
  'removendo /var/log/userlog...',
  'removendo /root/secret/README.txt...',
  'removendo /root/secret/cat_photos.zip...',
  'removendo /usr/share/wallpapers...',
  'removendo /boot/vmlinuz...',
  'Sistema corrompido!',
];

export default function MiauTerminal() {
  const { dispatch } = useGame();
  const { theme } = useTheme();
  const [n, setN] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const i = setInterval(() => setN(v => v >= LOGS.length ? v : v + 1), 320);
    return () => clearInterval(i);
  }, []);

  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [n]);

  useEffect(() => {
    if (n < LOGS.length) return;
    if (firedRef.current) return;
    firedRef.current = true;
    const t = setTimeout(() => dispatch({ type: 'CORRUPT_SYSTEM', payload: { source: 'miau' } }), 1800);
    return () => clearTimeout(t);
  }, [n, dispatch]);

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SpriteAvatar talking={true} size={32} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>miau@k1tty:~</Text>
          <Text style={styles.headerSub}>ela tomou o terminal</Text>
        </View>
      </View>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
        <Text style={styles.cmd}>{'$ rm -rf /'}</Text>
        <Text style={styles.confirm}>{'Digite "y" para confirmar:'}</Text>
        <Text style={styles.cmdY}>y</Text>
        {LOGS.slice(0, n).map((l, i) => (
          <Text key={i} style={[styles.log, i === LOGS.length - 1 && styles.logFinal]}>{l}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      padding: 8, borderBottomWidth: 1, borderBottomColor: '#EF6461',
      backgroundColor: 'rgba(60,0,0,0.5)',
    },
    headerTitle: { color: '#EF6461', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
    headerSub: { color: t.colors.dim, fontFamily: 'monospace', fontSize: 9 },
    cmd: { color: '#EF6461', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
    confirm: { color: t.colors.warning, fontFamily: 'monospace', fontSize: 11, marginTop: 4 },
    cmdY: { color: '#EF6461', fontFamily: 'monospace', fontSize: 11 },
    log: { color: t.colors.dim, fontFamily: 'monospace', fontSize: 10, lineHeight: 14 },
    logFinal: { color: '#EF6461', fontWeight: 'bold' },
  });
}