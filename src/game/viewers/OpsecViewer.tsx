// src/game/viewers/OpsecViewer.tsx
import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useGame } from '../state/GameContext';
import { useTheme } from '../theme/ThemeContext';

const HAS_ASSET = false;

export default function OpsecViewer() {
  const { dispatch } = useGame();
  const { theme } = useTheme();

  useEffect(() => {
    dispatch({ type: 'SET_FLAG', payload: { flag: 'sawOpsec', value: true } });
  }, [dispatch]);

  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (HAS_ASSET) {
    return <Image source={require('../../../assets/images/opsec.webp')} style={{ flex: 1 }} resizeMode="contain" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.big}>{'OP'}</Text>
      <Text style={styles.big}>{'SEC'}</Text>
      <Text style={styles.hint}>{'imagem nao disponivel no native'}</Text>
      <Text style={styles.hint}>{'copie public/pictures/opsec.webp para assets/images/ e mude HAS_ASSET para true'}</Text>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    big: {
      color: t.colors.command, fontFamily: 'monospace', fontSize: 44,
      fontWeight: 'bold', letterSpacing: 8,
      textShadowColor: t.colors.command, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16,
    },
    hint: { color: t.colors.dim, fontFamily: 'monospace', fontSize: 9, textAlign: 'center', paddingHorizontal: 20 },
  });
}