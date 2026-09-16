// src/game/viewers/AptCliViewer.tsx
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PACKAGES } from "../commands/packages";
import Emoji from "../components/Emoji";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";

export default function AptCliViewer() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const [status, setStatus] = useState("");
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const isInstalled = (id: string) => state.installedPackages.indexOf(id) >= 0;

  const flash = (m: string) => {
    setStatus(m);
    setTimeout(() => setStatus(""), 3000);
  };

  const install = (id: string) => {
    if (!state.wifiConnected) {
      flash("Erro: sem conexao com a internet.");
      return;
    }
    if (isInstalled(id)) {
      flash("Ja instalado.");
      return;
    }
    dispatch({ type: "INSTALL_PACKAGE", payload: id });
    dispatch({ type: "INCREMENT_PROGRESS", payload: 5 });
    flash("Instalado: " + id);
  };

  const remove = (id: string) => {
    if (!isInstalled(id)) {
      flash("Nao instalado.");
      return;
    }
    if (id === "apt-cli") {
      flash("Nao e possivel remover apt-cli em execucao.");
      return;
    }
    dispatch({ type: "REMOVE_PACKAGE", payload: id });
    flash("Removido: " + id);
  };

  const installed = state.installedPackages.length;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerText}>apt-cli</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Emoji size={10}>
            {state.wifiConnected ? "\u{1F7E2}" : "\u{1F534}"}
          </Emoji>
          <Text style={styles.headerSub}>
            {state.wifiConnected ? "online" : "offline"} .{" "}
            {installed + "/" + PACKAGES.length}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {PACKAGES.map((p) => {
          const on = isInstalled(p.id);
          const isSelf = p.id === "apt-cli";
          return (
            <View key={p.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.pkgName,
                    on && { color: theme.colors.command },
                  ]}
                >
                  {p.id}
                  {isSelf ? " (em uso)" : ""}
                </Text>
                <Text style={styles.pkgDesc} numberOfLines={1}>
                  {p.label}
                </Text>
              </View>
              <Pressable
                onPress={() => (on ? remove(p.id) : install(p.id))}
                disabled={isSelf}
                style={[
                  styles.btn,
                  on && styles.btnRemove,
                  isSelf && { opacity: 0.4 },
                ]}
              >
                <Text
                  style={[styles.btnText, on && { color: theme.colors.error }]}
                >
                  {on ? "remover" : "instalar"}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {status || installed + " pacote(s) instalado(s)"}
        </Text>
      </View>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 8,
      marginBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border + "40",
    },
    headerText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 13,
      fontWeight: "bold",
    },
    headerSub: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 10,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border + "20",
    },
    pkgName: {
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: "bold",
    },
    pkgDesc: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 10,
      marginTop: 2,
    },
    btn: {
      borderWidth: 1,
      borderColor: t.colors.command,
      borderRadius: 3,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    btnRemove: { borderColor: t.colors.error },
    btnText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 10,
    },
    footer: {
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: t.colors.border + "40",
    },
    footerText: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 10,
    },
  });
}
