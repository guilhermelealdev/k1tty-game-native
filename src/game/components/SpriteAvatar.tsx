// src/game/components/SpriteAvatar.tsx
// Detecta se os assets existem. Se nao, usa fallback ASCII.
// Para ativar: copie idle.webp e talking.png para assets/images/

import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

let HAS_ASSETS = false;
let IDLE: any = null;
let TALKING: any = null;

try {
  IDLE = require('../../../assets/images/idle.webp');
  TALKING = require('../../../assets/images/talking.png');
  HAS_ASSETS = true;
} catch (e) {
  HAS_ASSETS = false;
}

export default function SpriteAvatar({
  talking = false,
  size = 120,
  alt = 'avatar',
  style = {},
}: any) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (talking) {
      const i = setInterval(() => setBlink(b => !b), 200);
      return () => clearInterval(i);
    }
    const i = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 5000);
    return () => clearInterval(i);
  }, [talking]);

  if (HAS_ASSETS) {
    return (
      <Image
        source={talking ? TALKING : IDLE}
        style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
      />
    );
  }

  const fontSize = Math.max(8, Math.floor(size / 6));
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{
        color: '#cba6f7', fontFamily: 'monospace',
        fontSize, lineHeight: fontSize * 1.1, textAlign: 'center',
      }}>
        {blink || talking
          ? ' /\\_/\\ \n( o.o )\n > ^ < '
          : ' /\\_/\\ \n( -.- )\n > ^ < '}
      </Text>
    </View>
  );
}