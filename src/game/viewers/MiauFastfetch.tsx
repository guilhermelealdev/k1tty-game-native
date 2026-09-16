// src/game/viewers/MiauFastfetch.tsx
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import SpriteAvatar from "../components/SpriteAvatar";

const TALK_FLIP_MS = 300;

export default function MiauFastfetch({ line }: { line: string }) {
  const [talking, setTalking] = useState(true);
  const [avatarSize, setAvatarSize] = useState(140);

  useEffect(() => {
    const iv = setInterval(() => {
      setTalking((t) => !t);
    }, TALK_FLIP_MS);
    return () => clearInterval(iv);
  }, []);

  const handleRightLayout = (e: any) => {
    const h = e?.nativeEvent?.layout?.height;
    if (typeof h === "number" && h > 0) {
      setAvatarSize(Math.round(h));
    }
  };

  return (
    <View style={styles.container}>
      {/* Coluna esquerda: avatar empurrado pra direita */}
      <View
        style={[styles.avatarCol, { height: avatarSize, width: avatarSize }]}
      >
        <SpriteAvatar talking={talking} size={avatarSize} />
      </View>

      {/* Coluna direita */}
      <View style={styles.rightCol} onLayout={handleRightLayout}>
        <View style={styles.bubbleWrap}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleSpeaker}>miau:</Text>
            <Text style={styles.bubbleText}>{line}</Text>
          </View>
          <View style={styles.tailOuter} />
          <View style={styles.tailInner} />
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.infoLine}>
            <Text style={styles.infoLabel}>Usuario: </Text>
            <Text style={styles.infoValue}>k1tty@k1tty</Text>
          </Text>
          <Text style={styles.infoLine}>
            <Text style={styles.infoLabel}>Sistema: </Text>
            <Text style={styles.infoValue}>k1tty Linux 1.0.0-miau</Text>
          </Text>
          <Text style={styles.infoLine}>
            <Text style={styles.infoLabel}>Kernel: </Text>
            <Text style={styles.infoValue}>6.6.6-k1tty</Text>
          </Text>
          <Text style={styles.infoLine}>
            <Text style={styles.infoLabel}>Shell: </Text>
            <Text style={styles.infoValue}>ksh (miau shell)</Text>
          </Text>
          <Text style={styles.infoLine}>
            <Text style={styles.infoLabel}>Companhia:</Text>
            <Text style={styles.companion}> miau 🐱</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingLeft: 32, // <- empurra tudo pra direita
    paddingRight: 4,
  },
  avatarCol: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginLeft: 12, // <- reforço só no avatar
  },
  rightCol: {
    flex: 1,
    gap: 14,
  },
  bubbleWrap: {
    position: "relative",
    marginLeft: 8,
  },
  bubble: {
    backgroundColor: "#001a1d",
    borderWidth: 1,
    borderColor: "#cba6f7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#cba6f7",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  bubbleSpeaker: {
    color: "#cba6f7",
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  bubbleText: {
    color: "#f0e8ff",
    fontFamily: "monospace",
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
  tailOuter: {
    position: "absolute",
    left: -10,
    top: 18,
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderTopColor: "transparent",
    borderBottomWidth: 9,
    borderBottomColor: "transparent",
    borderRightWidth: 10,
    borderRightColor: "#cba6f7",
  },
  tailInner: {
    position: "absolute",
    left: -8,
    top: 19,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: "transparent",
    borderBottomWidth: 8,
    borderBottomColor: "transparent",
    borderRightWidth: 9,
    borderRightColor: "#001a1d",
  },
  infoBlock: {
    paddingLeft: 8,
  },
  infoLine: {
    fontFamily: "monospace",
    fontSize: 14,
    lineHeight: 21,
  },
  infoLabel: {
    color: "#95C623",
  },
  infoValue: {
    color: "#FFFBFA",
  },
  companion: {
    color: "#cba6f7",
    fontWeight: "bold",
  },
});
