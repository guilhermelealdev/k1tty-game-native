// src/game/viewers/MatrixViewer.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
const ROWS = 24;
const COLS = 30;
const TICK = 120;

export default function MatrixViewer() {
  const { theme } = useTheme();
  const [running, setRunning] = useState(true);
  const [grid, setGrid] = useState<string[]>([]);
  const drops = useRef<number[]>(Array(COLS).fill(0).map(() => Math.random() * ROWS));
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const next: string[] = [];
      for (let r = 0; r < ROWS; r++) {
        let line = '';
        for (let c = 0; c < COLS; c++) {
          const head = Math.floor(drops.current[c]);
          if (r === head) line += '\u2588';
          else if (r > head - 4 && r < head) line += CHARS[Math.floor(Math.random() * CHARS.length)];
          else line += ' ';
        }
        next.push(line);
      }
      setGrid(next);
      drops.current = drops.current.map(y => (y > ROWS + 4 && Math.random() > 0.95) ? 0 : y + 1);
    }, TICK);
    return () => clearInterval(interval);
  }, [running]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.canvasWrap}>
        {grid.length === 0 ? (
          <Text style={styles.placeholder}>carregando...</Text>
        ) : (
          grid.map((line, i) => (
            <Text key={i} style={styles.row}>{line}</Text>
          ))
        )}
      </View>
      <Pressable onPress={() => setRunning(r => !r)} style={styles.btn}>
        <Text style={styles.btnText}>{running ? 'pausar' : 'iniciar'}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    canvasWrap: {
      flex: 1, backgroundColor: '#000', borderRadius: 3, padding: 4,
      overflow: 'hidden',
    },
    row: {
      color: t.colors.command,
      fontFamily: 'monospace',
      fontSize: 9,
      lineHeight: 11,
    },
    placeholder: { color: t.colors.dim, fontFamily: 'monospace', fontSize: 10 },
    btn: {
      marginTop: 6, alignSelf: 'center',
      borderWidth: 1, borderColor: t.colors.border, borderRadius: 3,
      paddingHorizontal: 14, paddingVertical: 5,
    },
    btnText: { color: t.colors.command, fontFamily: 'monospace', fontSize: 10 },
  });
}