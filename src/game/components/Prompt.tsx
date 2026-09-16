// src/game/components/Prompt.tsx
import React from 'react';
import { Text } from 'react-native';

export default function Prompt({ path, theme }: { path: string; theme: any }) {
  const glow = {
    textShadowColor: theme.colors.command,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  };
  return (
    <Text style={{ fontFamily: 'monospace', fontSize: 13 }}>
      <Text style={[{ color: theme.colors.command, fontWeight: 'bold' }, glow]}>k1tty</Text>
      <Text style={{ color: theme.colors.border }}>@</Text>
      <Text style={[{ color: theme.colors.command, fontWeight: 'bold' }, glow]}>k1tty</Text>
      <Text style={{ color: theme.colors.border }}>:</Text>
      <Text style={[{ color: theme.colors.command }, glow]}>{path}</Text>
      <Text style={{ color: theme.colors.text }}>$ </Text>
    </Text>
  );
}