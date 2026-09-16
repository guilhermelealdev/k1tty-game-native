// src/game/viewers/BluetoothViewer.tsx
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Emoji from "../components/Emoji";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";

const DEVICES = [
  { id: 1, name: "JBL Speaker", pairable: false },
  { id: 2, name: "Samsung TV", pairable: false },
  { id: 3, name: "Alexa Echo", pairable: false },
  { id: 4, name: "iPhone do vizinho", pairable: false },
  { id: 5, name: "Fone Bluetooth", pairable: false },
  { id: 6, name: "k1tty-phone", pairable: true },
  { id: 7, name: "Smartwatch", pairable: false },
];

export default function BluetoothViewer() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const [found, setFound] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [log, setLog] = useState([]);
  const [connected, setConnected] = useState(false);

  const pushLog = useCallback(
    (m: string) => setLog((prev) => [...prev, m]),
    [],
  );

  const scan = () => {
    if (scanning) return;
    setScanning(true);
    setFound([]);
    pushLog("Procurando dispositivos...");
    let delay = 0;
    DEVICES.forEach((d, i) => {
      setTimeout(() => {
        setFound((prev) => [...prev, d]);
        pushLog("  " + d.name);
        if (i === DEVICES.length - 1) {
          setScanning(false);
          pushLog("Scan completo.");
        }
      }, delay);
      delay += 250;
    });
  };

  const connect = (dev: any) => {
    if (connected) {
      pushLog("Ja conectado. Desconecte primeiro.");
      return;
    }
    pushLog("Tentando conectar a " + dev.name + "...");
    setTimeout(() => {
      if (!dev.pairable) {
        pushLog(dev.name + " negou o pareamento.");
        return;
      }
      setConnected(true);
      pushLog("Conectado a " + dev.name + "!");
      pushLog("Aguardando transferencia de arquivos...");
      const files = [
        "lyric_1.meow",
        "lyric_2.meow",
        "lyric_3.meow",
        "lyric_4.meow",
        "lyric_5.meow",
        "Music_Locked/music_pack.zip",
      ];
      files.forEach((f, i) => {
        setTimeout(
          () => {
            pushLog("Recebendo: " + f);
            if (i === files.length - 1) {
              pushLog("6 arquivos recebidos em ~/from_phone/");
              dispatch({ type: "RECEIVE_PHONE_FILES" });
            }
          },
          400 * (i + 1),
        );
      });
    }, 800);
  };

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <Pressable onPress={scan} disabled={scanning} style={styles.btn}>
          <Text style={styles.btnText}>
            {scanning ? "Escaneando..." : "Escanear"}
          </Text>
        </Pressable>
        {connected && (
          <Pressable
            onPress={() => {
              setConnected(false);
              pushLog("Desconectado.");
            }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>Desconectar</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={{ maxHeight: 140 }}>
        {found.map((d) => (
          <View key={d.id} style={styles.deviceRow}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Emoji size={12}>{"\u{1F4E1}"}</Emoji>
              <Text style={styles.deviceName}>{d.name}</Text>
            </View>
            <Pressable
              onPress={() => connect(d)}
              disabled={connected}
              style={[styles.miniBtn, connected && { opacity: 0.4 }]}
            >
              <Text style={styles.miniBtnText}>Conectar</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <ScrollView style={styles.logWrap}>
        {log.map((l, i) => (
          <Text key={i} style={styles.logLine}>
            {l}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    topBar: { flexDirection: "row", gap: 6, marginBottom: 8 },
    btn: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 3,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    btnText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 10,
    },
    deviceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border + "30",
    },
    deviceName: {
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 11,
    },
    miniBtn: {
      borderWidth: 1,
      borderColor: t.colors.command,
      borderRadius: 3,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    miniBtnText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 9,
    },
    logWrap: {
      flex: 1,
      marginTop: 8,
      padding: 6,
      backgroundColor: t.colors.bgDeep,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: t.colors.border + "30",
    },
    logLine: {
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 9,
      lineHeight: 13,
    },
  });
}
