// src/game/components/KernelPanicScreen.tsx
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGame } from "../state/GameContext";

type Line = { t: string; kind?: "default" | "error" | "miau" };

const USER_PANIC: Line[] = [
  {
    t: "[    0.000000] Linux version 6.6.6-k1tty (root@k1tty) (gcc 13.2.0) #1 SMP",
  },
  { t: "[    0.000000] Command line: BOOT_IMAGE=/vmlinuz root=UUID=deadbeef" },
  { t: "[    0.000000] BIOS-provided physical RAM map:" },
  {
    t: "[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable",
  },
  {
    t: "[    0.000000] BIOS-e820: [mem 0x0000000000100000-0x00000000bffdffff] usable",
  },
  { t: "[    0.512301] Freeing SMP alternatives memory: 48K" },
  { t: "[    0.752119] Mount-cache hash table entries: 8192" },
  { t: "[   14.220912] k1tty: terminal initialized" },
  { t: "[   14.501883] k1tty: filesystem mounted (read-write)" },
  { t: "[   14.700442] k1tty: wifi daemon ready (offline)" },
  { t: "" },
  { t: "[  142.001241] gato: warning - user running suspicious commands" },
  { t: "[  142.450118] gato: CRITICAL - filesystem integrity compromised" },
  { t: "[  142.450911] gato: triggering protective shutdown" },
  { t: "[  142.451000] gato: ... boa sorte, k1tty." },
  { t: "" },
  {
    t: "[  142.451200] BUG: unable to handle kernel NULL pointer dereference",
    kind: "error",
  },
  { t: "[  142.451201] PGD 0 P4D 0" },
  { t: "[  142.451202] Oops: 0002 [#1] SMP NOPTI", kind: "error" },
  { t: "[  142.451203] CPU: 0 PID: 1337 Comm: k1tty Not tainted" },
  { t: "[  142.451204] Hardware name: k1tty Systems k1tty/1.0" },
  { t: "[  142.451205] RIP: 0010:k1tty_survive+0x42/0x100" },
  { t: "[  142.451206] Code: 48 89 e5 48 83 ec 20 48 c7 45 f8 00 00 00 00" },
  { t: "[  142.451207] RSP: 0018:ffffb8f2c07d3c28 EFLAGS: 00010246" },
  { t: "[  142.451208] RAX: 0000000000000000 RBX: ffff8e2c07d3c000" },
  { t: "[  142.451209] RDX: 0000000000000000 RSI: 0000000000000000" },
  { t: "" },
  { t: "[  142.451216] Call Trace:" },
  { t: "[  142.451217]  <TASK>" },
  { t: "[  142.451218]  dump_stack_lvl+0x1c/0x2a" },
  { t: "[  142.451219]  panic+0x11f/0x2e0" },
  { t: "[  142.451220]  k1tty_survive+0x42/0x100" },
  { t: "[  142.451221]  do_syscall_64+0x5c/0x90" },
  { t: "[  142.451222]  entry_SYSCALL_64_after_hwframe+0x6e/0xd0" },
  { t: "[  142.451223]  </TASK>" },
  { t: "" },
  {
    t: "[  142.451224] Modules linked in: gato ronronar meow brinquedo caixa_de_papelao",
  },
  { t: "[  142.451225] ---[ end trace 0000000000000000 ]---" },
  { t: "" },
  { t: "[  142.451300] Kernel panic - not syncing:", kind: "error" },
  { t: "                 k1tty: usuário apagou o sistema", kind: "error" },
  { t: "" },
  { t: "Não havia mais nada. Você olhou para o vazio." },
  { t: "Um terminal vazio é um terminal honesto." },
  { t: "Você fez isso. Não teve acidente nenhum." },
  { t: "" },
  { t: "[  142.451400] hardware watchdog: resetting system in 30s..." },
  { t: "[  142.451500] k1tty: save preserved." },
  { t: "[  142.451501] k1tty: see you on the other side." },
];

const MIAU_PANIC: Line[] = [
  {
    t: "[    0.000000] Linux version 6.6.6-k1tty (root@k1tty) (gcc 13.2.0) #1 SMP",
  },
  { t: "[    0.000000] Command line: BOOT_IMAGE=/vmlinuz root=UUID=deadbeef" },
  { t: "[   14.220912] k1tty: terminal initialized" },
  { t: "[   14.501883] k1tty: filesystem mounted (read-write)" },
  { t: "" },
  { t: "[  142.001241] miau: info - user response received", kind: "miau" },
  { t: "[  142.101881] miau: info - comparing emotional states", kind: "miau" },
  { t: "[  142.201488] miau: warning - escalating privileges", kind: "miau" },
  {
    t: "[  142.301022] miau: WARN - user crossed emotional threshold",
    kind: "miau",
  },
  {
    t: "[  142.400712] miau: WARN - o silêncio dela é pior que grito",
    kind: "miau",
  },
  {
    t: "[  142.440918] miau: CRITICAL - initiating assimilation protocol",
    kind: "miau",
  },
  { t: "" },
  { t: "[  142.450611] miau: overwriting filesystem inodes (0/4096)" },
  { t: "[  142.450711] miau: overwriting filesystem inodes (1024/4096)" },
  { t: "[  142.450811] miau: overwriting filesystem inodes (2048/4096)" },
  { t: "[  142.450911] miau: overwriting filesystem inodes (4096/4096)" },
  { t: "[  142.451012] miau: filesystem compromised", kind: "miau" },
  { t: "[  142.451051] miau: inserting self into kernel space", kind: "miau" },
  { t: "" },
  {
    t: "[  142.451100] general protection fault: 0x6d6961756d696175",
    kind: "error",
  },
  { t: "[  142.451101] KASAN: wild-memory-access in range 0x6d6961756d696000" },
  { t: "[  142.451102] CPU: 0 PID: 0 Comm: miau Tainted: G D W" },
  { t: "[  142.451105] RIP: 0010:miau_assimilate+0x69/0x666" },
  { t: "[  142.451106] Code: c5 33 00 00 48 89 e5 48 81 ec 66 06 00 00" },
  { t: "[  142.451107] RSP: 0018:ffffb8f2c07d3c28 EFLAGS: 00010246" },
  { t: "[  142.451108] RDX: 6d6961756d696175 RSI: 0000000000001337" },
  { t: "" },
  { t: "[  142.451116] Call Trace:" },
  { t: "[  142.451117]  <TASK>" },
  { t: "[  142.451118]  dump_stack_lvl+0x1c/0x2a" },
  { t: "[  142.451119]  panic+0x11f/0x2e0" },
  { t: "[  142.451120]  miau_assimilate+0x69/0x666" },
  { t: "[  142.451121]  miau_destroy_filesystem+0x13/0x13" },
  { t: "[  142.451123]  </TASK>" },
  { t: "" },
  { t: "[  142.451124] Modules linked in: miau gato ronronar meow brinquedo" },
  { t: "[  142.451125] ---[ cut here ]---" },
  { t: "" },
  { t: "[  142.451200] Kernel panic - not syncing:", kind: "error" },
  { t: "                 miau: você me deixou brava", kind: "error" },
  { t: "" },
  { t: "Eu avisei.", kind: "miau" },
  { t: "Eu SEMPRE aviso.", kind: "miau" },
  { t: "Você escolheu me irritar mesmo assim.", kind: "miau" },
  { t: "" },
  { t: "Agora não tem mais volta.", kind: "miau" },
  { t: "" },
  { t: "[  142.451300] hardware watchdog: resetting system in 30s..." },
  { t: "[  142.451400] miau: eu ainda estou aqui.", kind: "miau" },
  { t: "[  142.451500] miau: save preserved. só desta vez.", kind: "miau" },
];

export default function KernelPanicScreen() {
  const { state, dispatch } = useGame();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMiau = state.flags && state.flags.corruptedBy === "miau";
  const LINES = isMiau ? MIAU_PANIC : USER_PANIC;

  const [visible, setVisible] = useState(0);
  const [blink, setBlink] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const scrollRef = useRef<ScrollView>(null);
  const rebootFired = useRef(false);

  const fontSize = width < 400 ? 12 : 13.5;

  useEffect(() => {
    const iv = setInterval(() => {
      setVisible((v) => (v >= LINES.length ? v : v + 1));
    }, 55);
    return () => clearInterval(iv);
  }, [LINES.length]);

  useEffect(() => {
    const t = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [visible]);

  useEffect(() => {
    const finish = visible >= LINES.length;
    if (!finish) return;
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(iv);
          if (!rebootFired.current) {
            rebootFired.current = true;
            dispatch({ type: "REBOOT_FORCE" });
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [visible, LINES.length, dispatch]);

  const finished = visible >= LINES.length;
  const accent = isMiau ? "#cba6f7" : "#C7EF00";
  const errorColor = "#EF6461";
  const miauColor = "#cba6f7";
  const baseColor = "#d0d0d0";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {LINES.slice(0, visible).map((l, i) => {
          let color = baseColor;
          if (l.kind === "error") color = errorColor;
          else if (l.kind === "miau") color = miauColor;
          return (
            <Text
              key={i}
              style={[
                styles.line,
                { fontSize, lineHeight: fontSize * 1.35, color },
                l.kind === "error" && { fontWeight: "bold" },
                l.kind === "miau" && { fontWeight: "bold" },
              ]}
            >
              {l.t || " "}
            </Text>
          );
        })}

        {finished && (
          <View style={styles.promptRow}>
            <Text style={[styles.prompt, { color: accent, fontSize }]}>
              {(isMiau ? "miau@k1tty" : "k1tty@panic") + ":~$"}
            </Text>
            <Text
              style={{
                color: accent,
                fontFamily: "monospace",
                fontSize: fontSize,
                marginLeft: 6,
                opacity: blink ? 1 : 0,
              }}
            >
              ▌
            </Text>
          </View>
        )}
      </ScrollView>

      {finished && (
        <View
          style={[styles.btnWrap, { bottom: Math.max(24, insets.bottom + 16) }]}
        >
          <Text style={styles.countdown}>
            {"reboot automático em " + countdown + "s"}
          </Text>
          <Pressable
            onPress={() => {
              if (!rebootFired.current) {
                rebootFired.current = true;
                dispatch({ type: "REBOOT_FORCE" });
              }
            }}
            hitSlop={8}
            android_ripple={{ color: accent + "30" }}
            style={[styles.rebootBtn, { borderColor: accent }]}
          >
            <Text style={[styles.rebootText, { color: accent }]}>
              [ REBOOT AGORA ]
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 16 },
  line: {
    fontFamily: "monospace",
    marginBottom: 2,
  },
  promptRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  prompt: {
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  btnWrap: {
    position: "absolute",
    right: 20,
    alignItems: "flex-end",
    gap: 8,
  },
  countdown: {
    color: "#606060",
    fontFamily: "monospace",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  rebootBtn: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  rebootText: {
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 2,
  },
});
