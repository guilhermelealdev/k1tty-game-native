// src/game/viewers/BtopViewer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGame } from '../state/GameContext';
import { useTheme } from '../theme/ThemeContext';

const PROCS = ['k1tty-terminal', 'gato-daemon', 'purr-service', 'meow-scheduler', 'litter-cleaner'];

export default function BtopViewer() {
  const { state } = useGame();
  const { theme } = useTheme();
  const [cpu, setCpu] = useState(20);
  const [mem, setMem] = useState(50);
  const [rows, setRows] = useState<any[]>([]);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useEffect(() => {
    const tick = () => {
      setCpu(Math.floor(Math.random() * 40 + 10));
      setMem(Math.floor(Math.random() * 30 + 40));
      setRows(PROCS.map(name => ({
        name,
        cpu: Math.floor(Math.random() * 20 + 2),
        mem: Math.floor(Math.random() * 200 + 30),
      })));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const Bar = ({ value, color }: any) => (
    <View style={styles.barWrap}>
      <View style={[styles.barFill, { width: value + '%', backgroundColor: color }]} />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{'\u{1F4CA} Monitor do Sistema'}</Text>

      <View style={styles.box}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>CPU</Text>
          <Text style={styles.value}>{cpu + '%'}</Text>
        </View>
        <Bar value={cpu} color={theme.colors.command} />
      </View>

      <View style={styles.box}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>MEM</Text>
          <Text style={styles.value}>{mem + '%'}</Text>
        </View>
        <Bar value={mem} color={theme.colors.border} />
      </View>

      <Text style={[styles.label, { marginTop: 10, marginBottom: 4 }]}>Processos:</Text>
      {rows.map((r, i) => (
        <View key={i} style={styles.procRow}>
          <Text style={styles.procName}>{r.name}</Text>
          <Text style={styles.procVal}>{r.cpu + '%'}</Text>
          <Text style={styles.procVal}>{r.mem + 'MB'}</Text>
        </View>
      ))}

      <Text style={styles.footer}>
        {'WiFi: ' + (state.wifiConnected ? 'Conectado' : 'Off') + '  .  Pacotes: ' + state.installedPackages.length}
      </Text>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    title: { color: t.colors.command, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
    box: {
      borderWidth: 1, borderColor: t.colors.border + '40', borderRadius: 3,
      padding: 8, marginBottom: 6,
    },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label: { color: t.colors.command, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 },
    value: { color: t.colors.text, fontFamily: 'monospace', fontSize: 10 },
    barWrap: { height: 6, backgroundColor: t.colors.bgDeep, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%' },
    procRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: t.colors.border + '20',
    },
    procName: { color: t.colors.text, fontFamily: 'monospace', fontSize: 10, flex: 1 },
    procVal: { color: t.colors.dim, fontFamily: 'monospace', fontSize: 10, width: 55, textAlign: 'right' },
    footer: {
      color: t.colors.dim, fontFamily: 'monospace', fontSize: 9,
      marginTop: 8, textAlign: 'center',
    },
  });
}