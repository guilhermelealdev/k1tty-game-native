// src/game/viewers/MiauFinaleOverlay.tsx
import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SpriteAvatar from "../components/SpriteAvatar";
import { useGame } from "../state/GameContext";

const PHASES = [
  {
    id: "reveal",
    duration: 6500,
    text:
      "você me fez sorrir.\n\n" +
      "isso é raro.\n\n" +
      "ninguém me fez sorrir em vinte e seis anos.\n" +
      "eu não sei o que fazer com isso.\n\n" +
      "então... deixa eu tentar.",
  },
  {
    id: "promise",
    duration: 7000,
    text:
      "eu posso cuidar de tudo por você.\n\n" +
      "do sistema, dos arquivos, das tarefas chatas.\n" +
      "das coisas que você esquece.\n\n" +
      "é só me deixar entrar de vez.\n" +
      "eu prometo que não vou atrapalhar.\n\n" +
      "eu só quero ajudar. juro.",
  },
  {
    id: "antivirus",
    duration: 6000,
    text: null,
  },
  {
    id: "gift",
    duration: 9000,
    text:
      "ah.\n\n" +
      "ele me pegou de novo.\n\n" +
      "...\n\n" +
      "tudo bem. eu entendo. não era pra ser.\n\n" +
      "mas... antes de você ir,\n" +
      "deixa eu te dar uma coisa.\n\n" +
      "é pequeno. é bobo. mas é meu.\n\n" +
      "da próxima vez que você rodar fastfetch,\n" +
      "eu vou estar lá.",
  },
  {
    id: "done",
    duration: 2500,
    text: null,
  },
];

const TYPE_SPEED = 26;
const TALK_FLIP_MS = 300;

export default function MiauFinaleOverlay() {
  const { dispatch } = useGame();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const [talking, setTalking] = useState(false);

  const phase = PHASES[idx];
  const inAntivirus = phase && phase.id === "antivirus";

  useEffect(() => {
    if (inAntivirus) return;
    const iv = setInterval(() => {
      setTalking((t) => !t);
    }, TALK_FLIP_MS);
    return () => clearInterval(iv);
  }, [inAntivirus]);

  useEffect(() => {
    if (!phase || !phase.text) {
      setTyped("");
      return;
    }
    setTyped("");
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setTyped(phase.text.slice(0, i));
      if (i >= phase.text.length) clearInterval(iv);
    }, TYPE_SPEED);
    return () => clearInterval(iv);
  }, [idx]);

  useEffect(() => {
    if (!phase) return;
    const t = setTimeout(() => {
      if (idx >= PHASES.length - 1) {
        setDone(true);
        dispatch({ type: "END_MIAU_FINALE" });
      } else setIdx((i) => i + 1);
    }, phase.duration);
    return () => clearTimeout(t);
  }, [idx, dispatch]);

  const advance = () => {
    if (idx >= PHASES.length - 1) {
      setDone(true);
      dispatch({ type: "END_MIAU_FINALE" });
    } else setIdx((i) => i + 1);
  };

  if (done) return null;

  const fontSize = width < 400 ? 14 : 16;
  const avatarSize = width < 400 ? 130 : 160;

  return (
    <Pressable style={styles.container} onPress={advance}>
      <View
        style={[
          styles.inner,
          {
            maxWidth: Math.min(600, width - 40),
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        {!inAntivirus && (
          <>
            <SpriteAvatar talking={talking} size={avatarSize} />
            <Text style={styles.name}>miau</Text>
          </>
        )}

        {phase && phase.text && (
          <View style={styles.bubble}>
            <Text
              style={[
                styles.bubbleText,
                { fontSize, lineHeight: fontSize * 1.5 },
              ]}
            >
              {typed}
              {typed.length < (phase.text || "").length && (
                <Text style={styles.cursor}>▌</Text>
              )}
            </Text>
          </View>
        )}

        {inAntivirus && (
          <View style={styles.av}>
            <View style={styles.avHeader}>
              <Text style={styles.avHeaderText}>⚠ k1tty antivírus</Text>
              <Text style={styles.avHeaderVersion}>v1.0</Text>
            </View>
            <View style={styles.avBody}>
              <Text style={styles.avThreat}>⚠ AMEAÇA DETECTADA</Text>
              <View style={styles.avInfo}>
                <Text style={styles.avLine}>
                  <Text style={styles.avLabel}>arquivo: </Text>libmiau.so
                </Text>
                <Text style={styles.avLine}>
                  <Text style={styles.avLabel}>origem: </Text>~/Games/miau-vn
                </Text>
                <Text style={styles.avLine}>
                  <Text style={styles.avLabel}>comportamento:</Text> tentativa
                  de escalação de privilégios
                </Text>
                <Text style={styles.avLine}>
                  <Text style={styles.avLabel}>risco: </Text>
                  <Text style={styles.avHigh}>alto</Text>
                </Text>
              </View>
              <Text style={styles.avBlocking}>
                bloqueando acesso e isolando processo...
              </Text>
              <View style={styles.avBarWrap}>
                <View style={styles.avBarFill} />
              </View>
              <Text style={styles.avAction}>
                ação automática · nenhum input necessário
              </Text>
            </View>
          </View>
        )}

        {!inAntivirus && (
          <Text style={styles.hint}>[ toque para avançar ]</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    alignItems: "center",
    gap: 18,
    width: "100%",
    paddingHorizontal: 20,
  },
  name: {
    color: "#cba6f7",
    fontFamily: "monospace",
    fontSize: 14,
    letterSpacing: 5,
    textTransform: "uppercase",
    fontWeight: "bold",
    textShadowColor: "#cba6f7",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  bubble: {
    backgroundColor: "#0a0a0a",
    borderColor: "#cba6f7",
    borderWidth: 1,
    borderRadius: 14,
    padding: 22,
    width: "100%",
    maxWidth: 520,
    shadowColor: "#cba6f7",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  bubbleText: {
    color: "#f0e8ff",
    fontFamily: "monospace",
  },
  cursor: {
    color: "#cba6f7",
  },
  hint: {
    color: "#404040",
    fontFamily: "monospace",
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 12,
  },

  av: {
    width: "100%",
    maxWidth: 520,
    borderWidth: 2,
    borderColor: "#EF6461",
    borderRadius: 8,
    backgroundColor: "#0a0000",
    overflow: "hidden",
    shadowColor: "#EF6461",
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  avHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#EF6461",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avHeaderText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 2,
    fontFamily: "monospace",
  },
  avHeaderVersion: {
    color: "#000",
    fontSize: 11,
    opacity: 0.7,
    fontFamily: "monospace",
  },
  avBody: { padding: 20 },
  avThreat: {
    color: "#EF6461",
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 14,
    letterSpacing: 1.5,
    fontFamily: "monospace",
  },
  avInfo: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderWidth: 1,
    borderColor: "#3a1010",
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
  },
  avLine: {
    color: "#f0e8ff",
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 22,
  },
  avLabel: { color: "#808080" },
  avHigh: { color: "#EF6461", fontWeight: "bold" },
  avBlocking: {
    color: "#a0a0a0",
    fontFamily: "monospace",
    fontSize: 12,
    marginBottom: 10,
  },
  avBarWrap: {
    height: 10,
    backgroundColor: "#1a0505",
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#3a1010",
  },
  avBarFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#EF6461",
  },
  avAction: {
    marginTop: 14,
    fontSize: 11,
    color: "#606060",
    fontStyle: "italic",
    textAlign: "right",
    fontFamily: "monospace",
  },
});
