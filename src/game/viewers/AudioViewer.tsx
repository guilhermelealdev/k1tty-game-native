// src/game/viewers/AudioViewer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const ROWS = 8;
const COLS = 32;

export default function AudioViewer() {
  const { theme } = useTheme();
  const [running, setRunning] = useState(false);
  const [wave, setWave] = useState<string[]>([]);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      const lines: string[] = [];
      for (let r = 0; r < ROWS; r++) {
        let line = '';
        for (let c = 0; c < COLS; c++) {
          line += Math.random() > 0.5 ? '#' : ' ';
        }
        lines.push(line);
      }
      setWave(lines);
    }, 100);
    return () => clearInterval(iv);
  }, [running]);

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={{ flex: 1 }}>
      <Pressable onPress={() => setRunning(r => !r)} style={styles.btn}>
        <Text style={styles.btnText}>{running ? 'parar analise' : 'analisar audio'}</Text>
      </Pressable>
      <View style={styles.canvasWrap}>
        {wave.length === 0 ? (
          <Text style={styles.placeholder}>sem sinal</Text>
        ) : (
          wave.map((l, i) => <Text key={i} style={styles.row}>{l}</Text>)
        )}
      </View>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    btn: {
      alignSelf: 'center', marginBottom: 8,
      borderWidth: 1, borderColor: t.colors.border, borderRadius: 3,
      paddingHorizontal: 14, paddingVertical: 5,
    },
    btnText: { color: t.colors.command, fontFamily: 'monospace', fontSize: 10 },
    canvasWrap: {
      flex: 1, backgroundColor: '#000', borderRadius: 3, padding: 6,
      justifyContent: 'center', alignItems: 'center',
    },
    row: { color: t.colors.command, fontFamily: 'monospace', fontSize: 8, lineHeight: 11 },
    placeholder: { color: t.colors.dim, fontFamily: 'monospace', fontSize: 10 },
  });
}