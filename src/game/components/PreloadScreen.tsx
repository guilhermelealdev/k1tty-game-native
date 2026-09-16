// src/game/components/PreloadScreen.tsx
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";

const SERVICES = [
  "Reached target Basic System",
  "Started Load Kernel Modules",
  "Started Remount Root and Kernel File Systems",
  "Started Journal Service",
  "Started udev Kernel Device Manager",
  "Started Flush Journal to Persistent Storage",
  "Started Create Static Device Nodes in /dev",
  "Started File System Check on Root Device",
  "Started Network Manager",
  "Started Network Manager Script Dispatcher Service",
  "Started WPA Supplicant",
  "Reached target Network",
  "Reached target Network is Online",
  "Started kitty-cache.service",
  "Started gato-daemon.service",
  "Started meow-scheduler.service",
  "Started purr-service.service",
  "Started ronronar-daemon.service",
  "Started brinquedo.service",
  "Started caixa_de_papelao.service",
  "Started Update UTMP about System Boot/Shutdown",
  "Started User Login Management",
  "Started ksh login shell",
  "Reached target Multi-User System",
  "Reached target Graphical Interface",
];

const SUMMARY =
  "Startup finished in 7.412s (kernel) + 3.208s (userspace) = 10.620s";

const TYPE_SPEED = 8;
const TYPE_CHUNK = 2;
const BETWEEN_LINES_MS = 90;
const TAIL_MS = 900;

const C = {
  bg: "#001519",
  command: "#C7EF00",
  text: "#FFFBFA",
  dim: "#5a7a5a",
  warning: "#E8A87C",
  border: "#95C623",
};

export default function PreloadScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [completedCount, setCompletedCount] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [blink, setBlink] = useState(true);
  const [done, setDone] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const completedRef = useRef(false);
  const fadeOut = useRef(new Animated.Value(1)).current;

  // Cursor blink
  useEffect(() => {
    const iv = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(iv);
  }, []);

  // Typewriter dos servicos
  useEffect(() => {
    if (done) return;
    if (completedCount >= SERVICES.length) {
      setShowSummary(true);
      return;
    }

    const target = SERVICES[completedCount];

    if (currentText.length < target.length) {
      const t = setTimeout(() => {
        setCurrentText(target.slice(0, currentText.length + TYPE_CHUNK));
      }, TYPE_SPEED);
      return () => clearTimeout(t);
    }

    // Linha terminou - espera um pouco e passa pra proxima
    const t = setTimeout(() => {
      setCompletedCount((c) => c + 1);
      setCurrentText("");
    }, BETWEEN_LINES_MS);
    return () => clearTimeout(t);
  }, [completedCount, currentText, done]);

  // Typewriter do summary
  useEffect(() => {
    if (!showSummary) return;
    if (summaryText.length >= SUMMARY.length) {
      // Tudo pronto - aguarda e finaliza
      if (completedRef.current) return;
      completedRef.current = true;
      setDone(true);

      const t = setTimeout(() => {
        Animated.timing(fadeOut, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => onComplete());
      }, TAIL_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setSummaryText(SUMMARY.slice(0, summaryText.length + TYPE_CHUNK));
    }, TYPE_SPEED);
    return () => clearTimeout(t);
  }, [showSummary, summaryText, onComplete, fadeOut]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [completedCount, currentText, summaryText]);

  const totalLines = SERVICES.length + 1;
  const finishedLines = completedCount + (showSummary ? 1 : 0);
  const percent = Math.min(100, Math.floor((finishedLines / totalLines) * 100));

  const showCurrentLine = completedCount < SERVICES.length && !showSummary;

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>[ OK ] Reached target Basic System.</Text>

        {SERVICES.slice(0, completedCount).map((svc, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.ok}>[ OK ]</Text>
            <Text style={styles.line}>{svc}</Text>
          </View>
        ))}

        {showCurrentLine && (
          <View style={styles.row}>
            <Text style={styles.wait}>[ .... ]</Text>
            <Text style={styles.lineDim}>
              {currentText}
              <Text style={{ opacity: blink ? 1 : 0 }}>▌</Text>
            </Text>
          </View>
        )}

        {showSummary && (
          <View style={styles.row}>
            <Text style={styles.okSummary}>[ OK ]</Text>
            <Text style={styles.lineSummary}>
              {summaryText}
              {summaryText.length < SUMMARY.length && (
                <Text style={{ opacity: blink ? 1 : 0 }}>▌</Text>
              )}
            </Text>
          </View>
        )}

        {done && (
          <Text style={styles.ready}>
            entrando no sistema{" "}
            <Text style={{ opacity: blink ? 1 : 0 }}>▌</Text>
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flexDirection: "row", flexShrink: 1 }}>
          <Text style={styles.footerPrompt}>k1tty@boot</Text>
          <Text style={styles.footerSep}> — </Text>
          <Text style={styles.footerText}>
            {done ? "sessao iniciada" : "inicializando subsistemas"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.footerPercent}>{percent}%</Text>
          <Text
            style={{ color: C.command, opacity: blink ? 1 : 0, fontSize: 13 }}
          >
            {" "}
            ▌
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingTop: 50, paddingBottom: 90 },
  header: {
    color: C.command,
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 24,
  },
  row: { flexDirection: "row", gap: 10, marginBottom: 5 },
  ok: {
    color: C.command,
    fontFamily: "monospace",
    fontSize: 12.5,
    fontWeight: "bold",
    width: 76,
  },
  okSummary: {
    color: C.warning,
    fontFamily: "monospace",
    fontSize: 12.5,
    fontWeight: "bold",
    width: 76,
  },
  line: {
    flex: 1,
    color: C.text,
    fontFamily: "monospace",
    fontSize: 12.5,
    lineHeight: 18,
  },
  lineSummary: {
    flex: 1,
    color: C.warning,
    fontFamily: "monospace",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "bold",
  },
  wait: {
    color: C.warning,
    fontFamily: "monospace",
    fontSize: 12.5,
    fontWeight: "bold",
    width: 76,
  },
  lineDim: {
    flex: 1,
    color: C.dim,
    fontFamily: "monospace",
    fontSize: 12.5,
    lineHeight: 18,
  },
  ready: {
    color: C.command,
    fontFamily: "monospace",
    fontSize: 13,
    marginTop: 22,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(149, 198, 35, 0.25)",
    backgroundColor: "rgba(0, 21, 25, 0.95)",
  },
  footerPrompt: {
    color: C.command,
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: "bold",
  },
  footerSep: {
    color: C.dim,
    fontFamily: "monospace",
    fontSize: 12,
  },
  footerText: {
    color: C.dim,
    fontFamily: "monospace",
    fontSize: 12,
  },
  footerPercent: {
    color: C.command,
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "bold",
  },
});
