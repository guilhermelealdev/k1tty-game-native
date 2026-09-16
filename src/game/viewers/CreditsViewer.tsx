// src/game/viewers/CreditsViewer.tsx
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGame } from "../state/GameContext";

const CREDITS = [
  { type: "title", text: "Obrigado por jogar k1tty" },
  { type: "spacer" },
  { type: "normal", text: "Um jogo de exploração e descoberta" },
  { type: "spacer" },
  { type: "spacer" },
  { type: "head", text: "Desenvolvimento" },
  { type: "normal", text: "Você, o jogador curioso" },
  { type: "spacer" },
  { type: "spacer" },
  { type: "head", text: "Design de Puzzles" },
  { type: "normal", text: "O Gato Quântico" },
  { type: "spacer" },
  { type: "spacer" },
  { type: "head", text: "Trilha Sonora" },
  { type: "normal", text: "Miados Sinfônicos" },
  { type: "spacer" },
  { type: "spacer" },
  { type: "head", text: "Personagens" },
  { type: "normal", text: "k1tty (a dona do terminal)" },
  { type: "normal", text: "miau (a IA de 1998)" },
  { type: "spacer" },
  { type: "spacer" },
  { type: "head", text: "Agradecimentos Especiais" },
  { type: "normal", text: "Todos os gatos do mundo" },
  { type: "normal", text: "A comunidade k1tty" },
  { type: "normal", text: "Você, por chegar até aqui" },
  { type: "spacer" },
  { type: "spacer" },
  { type: "big", text: "Obrigado!" },
  { type: "spacer" },
  { type: "spacer" },
  { type: "spacer" },
  { type: "end", text: "F I M" },
];

const TOTAL_MS = 45000;

export default function CreditsViewer() {
  const { dispatch } = useGame();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / TOTAL_MS);
      setOffset(p * 5000);
    }, 80);

    const timer = setTimeout(() => {
      dispatch({ type: "START_FINALE" });
    }, TOTAL_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [dispatch]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTo({ y: offset, animated: false });
  }, [offset]);

  const fontSize = width < 400 ? 12 : 13;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <View style={{ height: 320 + insets.top }} />
        {CREDITS.map((c, i) => {
          if (c.type === "spacer")
            return <View key={i} style={{ height: 32 }} />;
          const st =
            c.type === "title"
              ? styles.title
              : c.type === "head"
                ? styles.head
                : c.type === "big"
                  ? styles.big
                  : c.type === "end"
                    ? styles.end
                    : styles.normal;
          return (
            <Text
              key={i}
              style={[
                st,
                {
                  fontSize:
                    c.type === "title"
                      ? fontSize + 8
                      : c.type === "big"
                        ? fontSize + 10
                        : c.type === "end"
                          ? fontSize + 8
                          : fontSize,
                },
              ]}
            >
              {c.text}
            </Text>
          );
        })}
        <View style={{ height: 500 + insets.bottom }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  title: {
    color: "#C7EF00",
    fontFamily: "monospace",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "#C7EF00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  head: {
    color: "#95C623",
    fontFamily: "monospace",
    fontWeight: "bold",
    textAlign: "center",
  },
  normal: { color: "#FFFBFA", fontFamily: "monospace", textAlign: "center" },
  big: {
    color: "#C7EF00",
    fontFamily: "monospace",
    textAlign: "center",
    fontWeight: "bold",
  },
  end: {
    color: "#FFFBFA",
    fontFamily: "monospace",
    letterSpacing: 12,
    textAlign: "center",
  },
});
