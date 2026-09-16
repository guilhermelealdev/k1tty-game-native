// src/game/viewers/LensViewer.tsx
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Emoji from "../components/Emoji";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";

function collectImages(node: any, path: string, out: any[]) {
  if (!node || !node.children) return;
  for (const name in node.children) {
    const child = node.children[name];
    const p = path === "/" ? "/" + name : path + "/" + name;
    if (child.type === "file" && /\.(jpg|jpeg|png|webp|gif)$/i.test(name)) {
      out.push({ path: p, name, node: child });
    } else if (child.type === "dir") {
      collectImages(child, p, out);
    }
  }
}

export default function LensViewer() {
  const { state } = useGame();
  const { theme } = useTheme();
  const [selected, setSelected] = useState(null);

  const images = useMemo(() => {
    const out: any[] = [];
    collectImages(state.filesystem, "/", out);
    return out.sort((a, b) => a.path.localeCompare(b.path));
  }, [state.filesystem]);

  const current = images.find((i) => i.path === selected) || images[0];
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (images.length === 0) {
    return (
      <View style={styles.empty}>
        <Emoji size={48}>{"\u{1F4F7}"}</Emoji>
        <Text style={styles.emptyText}>Nenhuma imagem no sistema.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.previewWrap}>
        <Emoji size={56}>{"\u{1F5BC}"}</Emoji>
        <Text style={styles.placeholderName} numberOfLines={1}>
          {current ? current.name : ""}
        </Text>
        <Text style={styles.placeholderHint}>
          {"imagem indisponivel no native - veja o nome do arquivo"}
        </Text>
      </View>

      <Text style={styles.listHeader}>{"IMAGENS (" + images.length + ")"}</Text>
      <ScrollView style={{ flex: 1 }}>
        {images.map((img) => {
          const on = current && current.path === img.path;
          return (
            <Pressable
              key={img.path}
              onPress={() => setSelected(img.path)}
              style={[styles.item, on && styles.itemActive]}
            >
              <Emoji size={14}>{"\u{1F4F7}"}</Emoji>
              <Text
                style={[styles.itemName, on && { color: theme.colors.command }]}
                numberOfLines={1}
              >
                {img.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    emptyText: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 11,
    },
    previewWrap: {
      flex: 1,
      minHeight: 160,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.colors.bgDeep,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: t.colors.border + "40",
      marginBottom: 8,
      gap: 6,
      padding: 10,
    },
    placeholderName: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: "bold",
      maxWidth: "100%",
    },
    placeholderHint: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 9,
      fontStyle: "italic",
      textAlign: "center",
    },
    listHeader: {
      color: t.colors.border,
      fontFamily: "monospace",
      fontSize: 9,
      letterSpacing: 1,
      marginBottom: 4,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 3,
      marginBottom: 3,
    },
    itemActive: { backgroundColor: t.colors.command + "20" },
    itemName: {
      flex: 1,
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 10,
    },
  });
}
