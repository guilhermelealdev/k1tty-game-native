// src/game/viewers/WhoIsThisViewer.tsx
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Emoji from "../components/Emoji";
import { formatDate, formatPermissions, formatSize } from "../fs/helpers";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";

function walk(node: any, path: string, out: any[]) {
  if (!node || !node.children) return;
  for (const name in node.children) {
    const child = node.children[name];
    const p = path === "/" ? "/" + name : path + "/" + name;
    out.push({ path: p, node: child });
    if (child.type === "dir") walk(child, p, out);
  }
}

export default function WhoIsThisViewer() {
  const { state } = useGame();
  const { theme } = useTheme();
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);

  const all = useMemo(() => {
    const out: any[] = [];
    walk(state.filesystem, "/", out);
    return out.sort((a, b) => a.path.localeCompare(b.path));
  }, [state.filesystem]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return all.slice(0, 100);
    const q = filter.toLowerCase();
    return all
      .filter((f) => f.path.toLowerCase().indexOf(q) >= 0)
      .slice(0, 100);
  }, [all, filter]);

  const current = selected ? all.find((f) => f.path === selected) : null;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={styles.search}
        value={filter}
        onChangeText={setFilter}
        placeholder="procurar arquivo..."
        placeholderTextColor={theme.colors.dim}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={{ flex: 1, flexDirection: "row", gap: 8 }}>
        <ScrollView style={[styles.list, { flex: 1 }]}>
          {filtered.map(({ path, node }) => {
            const on = selected === path;
            const icon =
              node.type === "dir"
                ? "\u{1F4C1}"
                : node.isImage
                  ? "\u{1F5BC}"
                  : "\u{1F4C4}";
            return (
              <Pressable
                key={path}
                onPress={() => setSelected(path)}
                style={[styles.item, on && styles.itemActive]}
              >
                <Emoji size={11}>{icon}</Emoji>
                <Text
                  style={[
                    styles.itemPath,
                    on && { color: theme.colors.command },
                  ]}
                  numberOfLines={1}
                >
                  {path}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {current && (
          <ScrollView style={[styles.detail, { flex: 1 }]}>
            <Text style={styles.detailTitle} numberOfLines={1}>
              {current.node.name}
            </Text>
            <Text style={styles.detailPath} numberOfLines={2}>
              {current.path}
            </Text>
            <Row
              label="Tipo"
              value={current.node.type === "dir" ? "diretorio" : "arquivo"}
              theme={theme}
            />
            <Row label="Dono" value={current.node.owner || "-"} theme={theme} />
            <Row
              label="Perms"
              value={formatPermissions(current.node)}
              theme={theme}
            />
            <Row
              label="Tamanho"
              value={
                current.node.type === "dir"
                  ? "-"
                  : formatSize(current.node.size || 0)
              }
              theme={theme}
            />
            <Row
              label="Modificado"
              value={formatDate(current.node.lastModified)}
              theme={theme}
            />
            <Row
              label="Oculto"
              value={current.node.hidden ? "sim" : "nao"}
              theme={theme}
            />
            <Row
              label="Bloqueado"
              value={current.node.locked ? "sim" : "nao"}
              theme={theme}
            />
            <Row
              label="Requer sudo"
              value={current.node.requiresSudo ? "sim" : "nao"}
              theme={theme}
            />
            <Row
              label="Tem senha"
              value={current.node.password ? "sim" : "nao"}
              theme={theme}
            />
            {current.node.content && (
              <Text style={styles.preview} numberOfLines={8}>
                {current.node.content.slice(0, 300)}
              </Text>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function Row({ label, value, theme }: any) {
  return (
    <View style={{ flexDirection: "row", gap: 6, paddingVertical: 2 }}>
      <Text
        style={{
          color: theme.colors.dim,
          fontFamily: "monospace",
          fontSize: 9,
          minWidth: 70,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          flex: 1,
          color: theme.colors.text,
          fontFamily: "monospace",
          fontSize: 9,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    search: {
      borderWidth: 1,
      borderColor: t.colors.border + "40",
      borderRadius: 3,
      paddingHorizontal: 8,
      paddingVertical: 5,
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 10,
      marginBottom: 8,
      backgroundColor: t.colors.bgDeep,
    },
    list: {
      borderWidth: 1,
      borderColor: t.colors.border + "30",
      borderRadius: 3,
      padding: 4,
    },
    item: {
      flexDirection: "row",
      gap: 4,
      alignItems: "center",
      paddingVertical: 3,
      paddingHorizontal: 4,
      borderRadius: 2,
      marginBottom: 2,
    },
    itemActive: { backgroundColor: t.colors.command + "20" },
    itemPath: {
      flex: 1,
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 9,
    },
    detail: {
      borderWidth: 1,
      borderColor: t.colors.border + "30",
      borderRadius: 3,
      padding: 8,
    },
    detailTitle: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: "bold",
    },
    detailPath: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 8,
      marginBottom: 6,
    },
    preview: {
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 9,
      padding: 6,
      backgroundColor: t.colors.bgDeep,
      borderRadius: 3,
      marginTop: 6,
    },
  });
}
