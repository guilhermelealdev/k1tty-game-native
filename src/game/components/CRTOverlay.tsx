// src/game/components/CRTOverlay.tsx
// Scanlines + vignette + flicker.
// Muito mais fiel ao web do que a versao anterior.

import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const SCANLINE_GAP = 3;

export default function CRTOverlay() {
  const flicker = useRef(new Animated.Value(1)).current;
  const { width, height } = Dimensions.get("window");

  // Flicker sutil - oscila entre 0.98 e 1.0
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, {
          toValue: 0.97,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.delay(2000 + Math.random() * 3000),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flicker]);

  // Gera as scanlines uma vez
  const scanlines = useMemo(() => {
    const count = Math.ceil(height / SCANLINE_GAP);
    return Array.from({ length: count }, (_, i) => i);
  }, [height]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Scanlines horizontais */}
      <View style={styles.scanlinesWrap}>
        {scanlines.map((i) => (
          <View key={i} style={[styles.scanline, { top: i * SCANLINE_GAP }]} />
        ))}
      </View>

      {/* Vignette nas 4 bordas - mais escuro nas pontas */}
      <LinearGradient
        colors={["rgba(0,0,0,0.5)", "transparent"]}
        style={[styles.edge, { top: 0, left: 0, right: 0, height: 100 }]}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)"]}
        style={[styles.edge, { bottom: 0, left: 0, right: 0, height: 140 }]}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.4)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.edge, { top: 0, bottom: 0, left: 0, width: 50 }]}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.4)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.edge, { top: 0, bottom: 0, right: 0, width: 50 }]}
      />

      {/* Flash de flicker */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "transparent", opacity: 0 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scanlinesWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  scanline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#000",
    opacity: 0.14,
  },
  edge: {
    position: "absolute",
  },
});
