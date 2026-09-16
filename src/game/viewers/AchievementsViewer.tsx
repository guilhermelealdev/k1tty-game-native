// src/game/viewers/AchievementsViewer.tsx
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Emoji from "../components/Emoji";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  TOTAL_ACHIEVEMENTS,
} from "../data/achievements";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";

export default function AchievementsViewer() {
  const { state } = useGame();
  const { theme } = useTheme();
  const unlocked = state.unlockedAchievements || [];
  const percent =
    TOTAL_ACHIEVEMENTS > 0
      ? Math.floor((unlocked.length / TOTAL_ACHIEVEMENTS) * 100)
      : 0;

  const byCategory = useMemo(() => {
    const m = {};
    for (const cat of Object.keys(ACHIEVEMENT_CATEGORIES)) {
      m[cat] = ACHIEVEMENTS.filter((a) => a.category === cat);
    }
    return m;
  }, []);

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Emoji size={16}>{"\u{1F3C6}"}</Emoji>
          <Text style={styles.title}>Conquistas</Text>
        </View>
        <Text style={styles.counter}>
          {unlocked.length + " / " + TOTAL_ACHIEVEMENTS}
        </Text>
      </View>
      <View style={styles.progressWrap}>
        <View style={[styles.progressFill, { width: percent + "%" }]} />
      </View>
      <Text style={styles.percentText}>{percent + "% concluido"}</Text>

      <ScrollView style={{ flex: 1, marginTop: 8 }}>
        {Object.entries(ACHIEVEMENT_CATEGORIES).map(([catId, meta]) => {
          const list = byCategory[catId] || [];
          if (list.length === 0) return null;
          const catUnlocked = list.filter((a) =>
            unlocked.includes(a.id),
          ).length;
          return (
            <View key={catId} style={{ marginBottom: 12 }}>
              <View style={styles.catHeader}>
                <Text style={[styles.catLabel, { color: meta.color }]}>
                  {"\u25B8 " + meta.label.toUpperCase()}
                </Text>
                <Text style={styles.catCount}>
                  {catUnlocked + "/" + list.length}
                </Text>
              </View>
              {list.map((a) => {
                const isUnlocked = unlocked.includes(a.id);
                const hide =
                  (a.hidden === true || a.category === "enigma") && !isUnlocked;
                return (
                  <View
                    key={a.id}
                    style={[
                      styles.item,
                      {
                        borderColor: isUnlocked
                          ? meta.color
                          : theme.colors.dim + "40",
                      },
                    ]}
                  >
                    <View
                      style={{
                        opacity: isUnlocked ? 1 : 0.4,
                        width: 26,
                        alignItems: "center",
                      }}
                    >
                      <Emoji size={20}>{hide ? "\u2753" : a.icon}</Emoji>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text
                        style={[
                          styles.name,
                          {
                            color: isUnlocked ? meta.color : theme.colors.dim,
                          },
                        ]}
                      >
                        {hide ? "???" : a.name}
                      </Text>
                      <Text style={styles.desc} numberOfLines={1}>
                        {hide ? "???" : a.desc}
                      </Text>
                    </View>
                    {isUnlocked && (
                      <Text style={[styles.check, { color: meta.color }]}>
                        {"\u2713"}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(t) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 6,
    },
    title: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 14,
      fontWeight: "bold",
    },
    counter: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "bold",
    },
    progressWrap: {
      height: 6,
      backgroundColor: t.colors.bgDeep,
      borderRadius: 3,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: t.colors.border + "40",
    },
    progressFill: {
      height: "100%",
      backgroundColor: t.colors.command,
    },
    percentText: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 9,
      textAlign: "right",
      marginTop: 3,
    },
    catHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 4,
      paddingBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.dim + "40",
    },
    catLabel: {
      fontFamily: "monospace",
      fontSize: 10,
      fontWeight: "bold",
      letterSpacing: 1,
    },
    catCount: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 9,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 3,
      padding: 6,
      marginBottom: 4,
    },
    name: {
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: "bold",
    },
    desc: {
      fontFamily: "monospace",
      fontSize: 9,
      color: t.colors.dim,
    },
    check: {
      fontFamily: "monospace",
      fontSize: 14,
    },
  });
}
