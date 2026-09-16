// src/game/components/TerminalChips.tsx
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { tapLight } from "../services/haptics";
import { useTheme } from "../theme/ThemeContext";

const COMMON_CMDS = [
  "ls",
  "ls -a",
  "cd",
  "cat",
  "pwd",
  "echo",
  "history",
  "clear",
  "help",
  "theme",
  "notes",
  "log",
  "fastfetch",
  "whatnow",
  "howleft",
  "web",
  "achievements",
  "sudo",
  "apt",
  "ping",
  "connect",
  "themes",
  "reboot",
];

export default function TerminalChips({
  input,
  commandHistory,
  onPick,
}: {
  input: string;
  commandHistory: string[];
  onPick: (cmd: string) => void;
}) {
  const { theme } = useTheme();

  const chips = useMemo(() => {
    if (input.trim()) {
      const q = input.trim().toLowerCase();
      const fromCmds = COMMON_CMDS.filter(
        (c) => c.startsWith(q) && c !== q,
      ).slice(0, 6);
      const fromHist = commandHistory
        .filter(
          (c) =>
            c.toLowerCase().startsWith(q) &&
            c !== input &&
            !fromCmds.includes(c),
        )
        .slice(0, 4);
      return [...fromCmds, ...fromHist];
    }
    return commandHistory.slice(-6).reverse();
  }, [input, commandHistory]);

  if (chips.length === 0) return null;

  const styles = makeStyles(theme);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {chips.map((c, i) => (
          <Pressable
            key={i}
            onPress={() => {
              tapLight();
              onPick(c);
            }}
            hitSlop={10}
            android_ripple={{ color: theme.colors.command + "30" }}
            style={styles.chip}
          >
            <Text style={styles.chipText} numberOfLines={1}>
              {c}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    wrap: {
      borderTopWidth: 1,
      borderTopColor: t.colors.border + "30",
      backgroundColor: t.colors.bgDeep,
      paddingVertical: 8,
    },
    row: {
      paddingHorizontal: 12,
      gap: 8,
      alignItems: "center",
    },
    chip: {
      minHeight: 40,
      borderWidth: 1,
      borderColor: t.colors.border + "70",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      justifyContent: "center",
      alignItems: "center",
    },
    chipText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 13,
      fontWeight: "500",
    },
  });
}
