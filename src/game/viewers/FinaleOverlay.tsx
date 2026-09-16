// src/game/viewers/FinaleOverlay.tsx
import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Emoji from "../components/Emoji";
import { useGame } from "../state/GameContext";

const GRID_SIZE = 20;
const COLS = 5;
const ROWS = 4;

const INTRO_TEXTS = [
  {
    id: "intro0",
    text: "Vinte fotos.\n\nÉ tudo que ela tinha.",
    duration: 3200,
  },
  {
    id: "intro1",
    text: "Cada uma delas,\numa memória que não caberia em texto.",
    duration: 3400,
  },
  {
    id: "intro2",
    text: "Não são só fotos de gato.\n\nSão a prova de que alguém\nse importou o suficiente\npra guardar.",
    duration: 4200,
  },
  { id: "intro3", text: "Obrigado, k1tty.", duration: 2600 },
];

const CATS_MS = 14000;

export default function FinaleOverlay() {
  const { state, dispatch } = useGame();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [phase, setPhase] = useState("intro0");

  useEffect(() => {
    const idx = INTRO_TEXTS.findIndex((t) => t.id === phase);
    if (idx === -1) return;
    const t = setTimeout(() => {
      if (idx === INTRO_TEXTS.length - 1) setPhase("cats");
      else setPhase(INTRO_TEXTS[idx + 1].id);
    }, INTRO_TEXTS[idx].duration);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "cats") return;
    const t = setTimeout(() => {
      if (state.currentSave !== null) {
        dispatch({ type: "SAVE_TO_SLOT", payload: state.currentSave });
      }
      setTimeout(() => dispatch({ type: "END_FINALE" }), 400);
    }, CATS_MS);
    return () => clearTimeout(t);
  }, [phase, dispatch, state.currentSave]);

  const skip = () => {
    if (phase === "cats") return;
    setPhase("cats");
  };

  if (phase !== "cats") {
    const intro = INTRO_TEXTS.find((t) => t.id === phase);
    const isBig = phase === "intro1" || phase === "intro3";
    return (
      <Pressable
        style={[
          styles.introWrap,
          {
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        onPress={skip}
      >
        <Text
          style={[
            styles.introText,
            {
              fontSize: isBig ? 26 : 20,
              lineHeight: isBig ? 38 : 30,
            },
          ]}
        >
          {intro?.text}
        </Text>
        <Text
          style={[styles.skipHint, { bottom: insets.bottom + 24, right: 24 }]}
        >
          [ toque para pular ]
        </Text>
      </Pressable>
    );
  }

  const usableW = width - insets.left - insets.right - 16;
  const usableH = height - insets.top - insets.bottom - 40;
  const cellW = usableW / COLS;
  const cellH = usableH / ROWS;

  return (
    <View
      style={[
        styles.gridWrap,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
          paddingLeft: insets.left + 8,
          paddingRight: insets.right + 8,
        },
      ]}
    >
      {Array.from({ length: GRID_SIZE }).map((_, i) => (
        <View
          key={i}
          style={[styles.cell, { width: cellW - 4, height: cellH - 4 }]}
        >
          <Emoji size={Math.min(cellW, cellH) * 0.6}>{"\u{1F431}"}</Emoji>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  introWrap: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  introText: {
    color: "#C7EF00",
    fontFamily: "monospace",
    textAlign: "center",
    fontWeight: "bold",
    textShadowColor: "#C7EF00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  skipHint: {
    position: "absolute",
    color: "#404040",
    fontFamily: "monospace",
    fontSize: 11,
    letterSpacing: 2,
  },
  gridWrap: {
    flex: 1,
    backgroundColor: "#000",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignContent: "center",
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#001a1d",
    borderRadius: 6,
    margin: 2,
    shadowColor: "#C7EF00",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});
