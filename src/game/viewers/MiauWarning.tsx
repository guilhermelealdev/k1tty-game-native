// src/game/viewers/MiauWarning.tsx
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Emoji from "../components/Emoji";
import SpriteAvatar from "../components/SpriteAvatar";

const MSGS = [
  "SISTEMA INFECTADO",
  "VOCE NAO DEVIA TER FEITO ISSO",
  "EU ESTOU EM TODO LUGAR",
  "NAO TENTE FECHAR NADA",
  "EU AVISEI",
  "VOCE NAO ESTA SOZINHA",
  "SEU TERMINAL E MEU AGORA",
];

export default function MiauWarning() {
  const msg = useMemo(() => MSGS[Math.floor(Math.random() * MSGS.length)], []);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setFlash((f) => !f), 500);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      setShake(true);
      setTimeout(() => setShake(false), 120);
    }, 1800);
    return () => clearInterval(i);
  }, []);

  return (
    <View
      style={[
        styles.container,
        flash && styles.flash,
        shake && { transform: [{ translateX: 2 }] },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <SpriteAvatar talking={true} size={40} />
        <Text style={styles.msg} numberOfLines={2}>
          {msg}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 4 }}>
        <Emoji size={12}>{"\u26A0"}</Emoji>
        <Emoji size={12}>{"\u26A0"}</Emoji>
        <Emoji size={12}>{"\u26A0"}</Emoji>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(30,0,0,0.7)",
    borderWidth: 1,
    borderColor: "#EF6461",
    padding: 8,
  },
  flash: { backgroundColor: "rgba(120,0,0,0.9)" },
  msg: {
    color: "#EF6461",
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "bold",
    maxWidth: 200,
  },
});
