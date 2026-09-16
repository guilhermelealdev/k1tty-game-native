// src/game/viewers/RamViewer.tsx
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Emoji from "../components/Emoji";
import { useTheme } from "../theme/ThemeContext";

const ADS = [
  "Baixe RAM gratis agora!",
  "Acelere seu PC com RAM virtual!",
  "+16GB de RAM instantanea!",
  "Seu sistema esta lento? Instale RAM!",
  "RAM ilimitada por apenas R$0,00!",
];

export default function RamViewer() {
  const { theme } = useTheme();
  const [amount, setAmount] = useState(0);
  const [ads, setAds] = useState([]);
  const [installing, setInstalling] = useState(true);

  useEffect(() => {
    if (!installing) return;
    const iv = setInterval(() => {
      setAmount((prev) => {
        if (prev >= 64) {
          setInstalling(false);
          return prev;
        }
        return prev + 4;
      });
      setAds((prev) => [...prev, ADS[Math.floor(Math.random() * ADS.length)]]);
    }, 500);
    return () => clearInterval(iv);
  }, [installing]);

  const reset = () => {
    setAmount(0);
    setAds([]);
    setInstalling(true);
  };
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Emoji size={18}>{"\u{1F4BE}"}</Emoji>
        <Text style={styles.title}>Instalador de RAM Virtual</Text>
      </View>
      <View style={styles.counterBox}>
        <Text style={styles.amount}>{amount + " GB"}</Text>
        <Text style={styles.sub}>
          {installing ? "(instalando...)" : "(concluido!)"}
        </Text>
        <View style={styles.barWrap}>
          <View
            style={[
              styles.barFill,
              { width: Math.min(100, (amount / 64) * 100) + "%" },
            ]}
          />
        </View>
      </View>

      <Text style={styles.section}>Propagandas recebidas:</Text>
      <ScrollView style={{ flex: 1 }}>
        {ads.map((ad, i) => (
          <Text key={i} style={styles.ad}>
            {ad}
          </Text>
        ))}
      </ScrollView>

      <Pressable onPress={reset} style={styles.btn}>
        <Text style={styles.btnText}>Reinstalar RAM</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    title: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "bold",
    },
    counterBox: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 4,
      padding: 12,
      alignItems: "center",
      marginBottom: 12,
    },
    amount: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 30,
      fontWeight: "bold",
    },
    sub: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 10,
      marginTop: 4,
    },
    barWrap: {
      width: "100%",
      height: 12,
      backgroundColor: t.colors.bgDeep,
      borderRadius: 6,
      marginTop: 10,
      overflow: "hidden",
    },
    barFill: { height: "100%", backgroundColor: t.colors.command },
    section: {
      color: t.colors.border,
      fontFamily: "monospace",
      fontSize: 10,
      marginBottom: 4,
    },
    ad: {
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 10,
      paddingVertical: 3,
    },
    btn: {
      marginTop: 8,
      alignSelf: "center",
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 3,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    btnText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 10,
    },
  });
}
