// src/game/components/TouchRipple.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const POOL = 8;

export default function TouchRipple({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const idRef = useRef(0);

  const handleCapture = useCallback((e: any) => {
    const ne = e.nativeEvent;
    if (!ne) return;

    // locationX/Y e relativo ao elemento que recebeu o evento
    const x = ne.locationX;
    const y = ne.locationY;
    if (typeof x !== "number" || typeof y !== "number") return;

    const id = ++idRef.current;
    setRipples((prev) => [...prev.slice(-(POOL - 1)), { id, x, y }]);

    // Retorna false = nao captura o responder. Deixa os filhos reagirem normalmente.
    return false;
  }, []);

  const remove = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <View style={{ flex: 1 }} onStartShouldSetResponderCapture={handleCapture}>
      {children}

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {ripples.map((r) => (
          <Ripple key={r.id} x={r.x} y={r.y} onEnd={() => remove(r.id)} />
        ))}
      </View>
    </View>
  );
}

function Ripple({ x, y, onEnd }: { x: number; y: number; onEnd: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 550,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => onEnd());
  }, [anim, onEnd]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 4],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [1, 0.6, 0],
  });

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          left: x - 15,
          top: y - 15,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ripple: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#C7EF00",
    backgroundColor: "rgba(199, 239, 0, 0.15)",
    shadowColor: "#C7EF00",
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});
