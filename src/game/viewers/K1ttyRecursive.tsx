// src/game/viewers/K1ttyRecursive.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useGame } from '../state/GameContext';
import { useTheme } from '../theme/ThemeContext';

export default function K1ttyRecursive() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const [depth, setDepth] = useState(0);
  const firedRef = useRef(false);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useEffect(() => {
    if (depth > 0 && !firedRef.current) {
      firedRef.current = true;
      dispatch({ type: 'SET_FLAG', payload: { flag: 'usedRecursive', value: true } });
    }
  }, [depth, dispatch]);

  const spawn = () => {
    if (depth >= 6) return;
    setDepth(d => d + 1);
    dispatch({ type: 'OPEN_WINDOW', payload: 'k1tty-recursive' });
  };

  const lines = [];
  for (let i = 0; i < depth; i++) lines.push('\u250C' + '\u2500'.repeat(30) + '\u2510');
  lines.push('  ' + 'k1tty dentro de k1tty'.padEnd(28) + '  ');
  for (let i = 0; i < depth; i++) lines.push('\u2514' + '\u2500'.repeat(30) + '\u2518');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recursao nivel {depth}</Text>
      <Text style={styles.ascii}>{lines.join('\n')}</Text>
      <Text style={styles.hint}>
        {depth >= 6 ? 'Limite atingido - nao abra mais.' : 'k1tty dentro de k1tty. Quanto mais fundo?'}
      </Text>
      <Pressable onPress={spawn} style={[styles.btn, depth >= 6 && styles.btnDisabled]}>
        <Text style={styles.btnText}>abrir outro k1tty</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
    title: {
      color: t.colors.command, fontFamily: 'monospace', fontSize: 12,
      fontWeight: 'bold', letterSpacing: 2,
    },
    ascii: {
      color: t.colors.command, fontFamily: 'monospace', fontSize: 10,
      lineHeight: 13, textAlign: 'center',
    },
    hint: { color: t.colors.dim, fontFamily: 'monospace', fontSize: 10, textAlign: 'center' },
    btn: {
      borderWidth: 1, borderColor: t.colors.command, borderRadius: 3,
      paddingHorizontal: 14, paddingVertical: 6, marginTop: 6,
    },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: t.colors.command, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
  });
}