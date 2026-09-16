// src/game/viewers/BonsaiViewer.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Emoji from "../components/Emoji";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";

const FRAMES = [
  "      .",
  "     /|\\\n      |",
  "     .-.\n    /   \\\n     \\ /\n      |",
  "     .-.\n    /   \\\n   /  .  \\\n   \\  \\  /\n    \\ | /\n     \\|/\n      |",
  "     ___\n    /   \\\n   /  .  \\\n  /  / \\  \\\n  \\ /   \\ /\n   \\     /\n    \\   /\n     \\ /\n      |",
  "      ___\n     /   \\\n    /  .  \\\n   /  / \\  \\\n  /  /   \\  \\\n  \\ /     \\ /\n   \\       /\n    \\     /\n     \\   /\n      \\ /\n       |",
];

const POT = "   _______\n  /       \\\n /_________\\";

export default function BonsaiViewer() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const [frame, setFrame] = useState(0);
  const [growing, setGrowing] = useState(true);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!growing) return;
    const iv = setInterval(() => {
      setFrame((prev) => {
        if (prev >= FRAMES.length - 1) {
          setGrowing(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(iv);
  }, [growing]);

  useEffect(() => {
    if (
      !growing &&
      !firedRef.current &&
      !(state.flags && state.flags.bonsaiComplete)
    ) {
      firedRef.current = true;
      dispatch({
        type: "SET_FLAG",
        payload: { flag: "bonsaiComplete", value: true },
      });
    }
  }, [growing, state.flags, dispatch]);

  const reset = () => {
    setFrame(0);
    setGrowing(true);
    firedRef.current = false;
  };
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Emoji size={14}>{"\u{1F33F}"}</Emoji>
        <Text style={styles.title}>BONSAI</Text>
      </View>
      <View style={{ alignItems: "center" }}>
        <Text style={styles.tree}>{FRAMES[frame]}</Text>
        <Text style={styles.pot}>{POT}</Text>
      </View>
      <Text style={styles.status}>
        {growing
          ? "crescendo... " + (frame + 1) + "/" + FRAMES.length
          : "completo"}
      </Text>
      <Pressable onPress={reset} style={styles.btn}>
        <Text style={styles.btnText}>replantar</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    title: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 12,
      letterSpacing: 2,
      marginBottom: 8,
    },
    tree: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 10,
      lineHeight: 12,
    },
    pot: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 10,
      lineHeight: 12,
    },
    status: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 10,
      marginTop: 8,
    },
    btn: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 3,
      paddingHorizontal: 14,
      paddingVertical: 5,
      marginTop: 6,
    },
    btnText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 10,
    },
  });
}
