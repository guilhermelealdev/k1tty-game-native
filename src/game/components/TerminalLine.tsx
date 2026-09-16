// src/game/components/TerminalLine.tsx
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { tapLight } from "../services/haptics";
import Prompt from "./Prompt";

// Speed adaptativo: textos curtos = lento, textos longos = rapido
function getSpeedFor(len: number) {
  if (len <= 200) return 22;
  if (len <= 600) return 14;
  if (len <= 1500) return 8;
  return 4;
}

const MAX_ANIMATE_LEN = 4000;

function colorFor(theme: any, type: string) {
  switch (type) {
    case "error":
      return theme.colors.error;
    case "success":
      return theme.colors.command;
    case "warning":
      return theme.colors.warning;
    case "info":
      return theme.colors.dim;
    default:
      return theme.colors.text;
  }
}

function TerminalLineComponent({
  entry,
  theme,
  path,
  animate,
  onAnimationDone,
  onTick,
}: any) {
  const [copied, setCopied] = useState<boolean>(false);

  const shouldAnimate =
    animate &&
    typeof entry.output === "string" &&
    entry.output.length > 0 &&
    entry.output.length <= MAX_ANIMATE_LEN;

  const [displayed, setDisplayed] = useState<string>(
    shouldAnimate ? "" : entry.output || "",
  );
  const [isTyping, setIsTyping] = useState<boolean>(shouldAnimate);
  const doneRef = useRef<boolean>(!shouldAnimate);

  const onDoneRef = useRef(onAnimationDone);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onDoneRef.current = onAnimationDone;
  }, [onAnimationDone]);
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayed(entry.output || "");
      setIsTyping(false);
      doneRef.current = true;
      return;
    }

    doneRef.current = false;
    setIsTyping(true);
    setDisplayed("");

    const text = entry.output || "";
    const speed = getSpeedFor(text.length);

    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));

      if (onTickRef.current) onTickRef.current();

      if (i >= text.length) {
        clearInterval(iv);
        setDisplayed(text);
        setIsTyping(false);
        if (!doneRef.current) {
          doneRef.current = true;
          setTimeout(() => onDoneRef.current?.(), 0);
        }
      }
    }, speed);

    return () => clearInterval(iv);
  }, [entry.output, shouldAnimate]);

  const color = colorFor(theme, entry.type);
  const glow =
    entry.type === "error" || entry.type === "success"
      ? {
          textShadowColor: color,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 4,
        }
      : null;

  const copyAll = async () => {
    const text = entry.command + (entry.output ? "\n" + entry.output : "");
    try {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      tapLight();
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <Pressable
      onLongPress={copyAll}
      delayLongPress={500}
      style={{ marginBottom: 14 }}
    >
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}
      >
        <Prompt path={path || "~"} theme={theme} />
        <Text style={styles.command}>{entry.command}</Text>
        {copied && (
          <Text style={[styles.copied, { color: theme.colors.command }]}>
            copiado
          </Text>
        )}
      </View>

      {entry.output ? (
        <Text
          style={[
            styles.output,
            { color },
            glow,
            entry.type === "info" && styles.italic,
          ]}
        >
          {displayed}
          {isTyping && <Text style={[styles.cursor, { color }]}>▌</Text>}
        </Text>
      ) : null}
    </Pressable>
  );
}

/* ============================================================
   U6: React.memo com comparator customizado.
   Re-renderiza SO se:
     - entry mudou de referencia
     - animate mudou
     - theme mudou
     - path mudou
   ============================================================ */
const TerminalLine = React.memo(TerminalLineComponent, (prev, next) => {
  return (
    prev.entry === next.entry &&
    prev.animate === next.animate &&
    prev.theme === next.theme &&
    prev.path === next.path
  );
});

export default TerminalLine;

const styles = StyleSheet.create({
  command: {
    color: "#C7EF00",
    fontFamily: "monospace",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 6,
  },
  copied: {
    fontFamily: "monospace",
    fontSize: 11,
    marginLeft: 8,
    fontStyle: "italic",
  },
  output: {
    fontFamily: "monospace",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
    marginLeft: 4,
  },
  italic: { fontStyle: "italic" },
  cursor: { fontFamily: "monospace", fontSize: 15 },
});
