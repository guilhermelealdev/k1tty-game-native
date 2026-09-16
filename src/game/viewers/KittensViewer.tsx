// src/game/viewers/KittensViewer.tsx
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Emoji from "../components/Emoji";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";
import { DEFAULT_THEME_ID, THEMES } from "../theme/themes";

export default function KittensViewer() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const active = state.theme || DEFAULT_THEME_ID;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const apply = (id: string) => {
    dispatch({ type: "SET_THEME", payload: id });
    dispatch({ type: "STAT_PUSH", payload: { key: "themesUsed", value: id } });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Emoji size={14}>{"\u{1F431}"}</Emoji>
        <Text style={styles.header}>
          {"kittens . " + THEMES.length + " temas"}
        </Text>
      </View>
      <ScrollView style={{ flex: 1, marginTop: 8 }}>
        {THEMES.map((t) => {
          const isActive = t.id === active;
          const c = t.colors;
          return (
            <Pressable
              key={t.id}
              onPress={() => apply(t.id)}
              style={[styles.card, isActive && { borderColor: c.command }]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={[styles.name, { color: c.command }]}>
                  {t.name}
                  {isActive ? "  . ATIVO" : ""}
                </Text>
              </View>
              <View style={styles.swatches}>
                {[c.bg, c.bgPanel, c.text, c.command, c.border, c.error].map(
                  (col, i) => (
                    <View
                      key={i}
                      style={[styles.swatch, { backgroundColor: col }]}
                    />
                  ),
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    header: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
    card: {
      borderWidth: 1,
      borderColor: t.colors.border + "40",
      borderRadius: 4,
      padding: 10,
      marginBottom: 8,
      backgroundColor: t.colors.bgDeep,
    },
    name: {
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "bold",
    },
    swatches: { flexDirection: "row", gap: 4, marginTop: 6 },
    swatch: {
      width: 18,
      height: 18,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: "#ffffff20",
    },
  });
}
