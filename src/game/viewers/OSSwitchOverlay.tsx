// src/game/viewers/OSSwitchOverlay.tsx
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useGame } from "../state/GameContext";

/* ============================================================
   ASCII do d0ggy OS (cachorrinho).
   Array de linhas evita problemas de escape.
   ============================================================ */
const DOGGY_ASCII_LINES = [
  "         __",
  "        /  \\",
  "       / ..|\\",
  "      (_\\  |_)",
  "      /  \\@'",
  "     /     \\",
  "_   /  `   |",
  "\\/  \\  | _\\",
  " \\   /_ || \\_",
  "  \\____)|_) \\_)",
];

const LINES: {
  t: string;
  d: number;
  style?: "warn" | "info" | "dim" | "big" | "ascii";
}[] = [
  { t: "Desligando k1tty OS...", d: 600, style: "big" },
  { t: "", d: 300 },

  { t: "k1tty está encerrando a sessão com calma.", d: 500, style: "info" },
  { t: "Não há pressa. Você não precisa ir.", d: 700, style: "info" },
  { t: "Mas você decidiu ir.", d: 900, style: "info" },
  { t: "", d: 400 },

  { t: "Unmounting /home/k1tty................ OK", d: 350 },
  { t: "Unmounting /home/k1tty/Documents...... OK", d: 350 },
  { t: "  > as cartas, os avisos, os nomes esquecidos", d: 400, style: "dim" },
  { t: "Unmounting /home/k1tty/Music.......... OK", d: 350 },
  { t: "  > as cinco letras, o TOKEN, o eco", d: 400, style: "dim" },
  { t: "Unmounting /home/k1tty/Pictures....... OK", d: 350 },
  { t: "  > fotos que ninguém mais vai olhar", d: 400, style: "dim" },
  { t: "Unmounting /home/k1tty/.notes.txt..... OK", d: 350 },
  { t: "  > as coisas que você escreveu sem pensar", d: 400, style: "dim" },
  { t: "", d: 400 },

  { t: "Unmounting /var....................... OK", d: 350 },
  { t: "Unmounting /tmp....................... OK", d: 300 },
  { t: "  > tudo que era temporário, já não é mais", d: 400, style: "dim" },
  { t: "Unmounting /etc....................... OK", d: 350 },
  { t: "Unmounting /root/secret............... OK", d: 500 },
  { t: "  > o cofre, agora vazio", d: 400, style: "dim" },
  { t: "", d: 400 },

  { t: "Stopping gato-daemon.service.......... OK", d: 350 },
  { t: "Stopping purr-service.service......... OK", d: 350 },
  { t: "Stopping meow-scheduler.service....... OK", d: 350 },
  { t: "Stopping ronronar-daemon.service...... OK", d: 350 },
  { t: "Stopping miau-finale.service.......... OK", d: 400 },
  { t: "  > a miau não resiste. ela nunca resiste.", d: 500, style: "dim" },
  { t: "", d: 400 },

  { t: "Reached target Shutdown.              OK", d: 600, style: "warn" },
  { t: "", d: 400 },

  { t: "k1tty OS encerrado.", d: 1000, style: "big" },
  { t: "Nenhum sinal. Nenhuma resposta.", d: 800, style: "info" },
  { t: "O terminal ficou preto.", d: 700, style: "info" },
  { t: "", d: 500 },

  /* ============================================================
     Instalação do d0ggy OS
     ============================================================ */
  { t: "> Inserindo disco de instalação...", d: 800, style: "warn" },
  {
    t: "  > o mundo não termina quando um sistema acaba",
    d: 500,
    style: "dim",
  },
  { t: "> Montando /dev/sr0 em /media/d0ggy...", d: 500, style: "warn" },
  { t: "  > reconhecendo imagem: d0ggy.iso", d: 400, style: "dim" },
  { t: '  > d0ggy OS 1.0 "Good Boy"', d: 500, style: "dim" },
  { t: "", d: 400 },

  { t: 'Carregando d0ggy OS 1.0 "Good Boy"...', d: 800, style: "warn" },
  { t: "", d: 300 },

  /* ASCII do cachorro */
  { t: DOGGY_ASCII_LINES.join("\n"), d: 1100, style: "ascii" },

  { t: "", d: 400 },
  { t: "[  OK  ] Kernel d0ggy carregado", d: 400 },
  { t: "[  OK  ] Woof daemon iniciado", d: 400 },
  { t: "[  OK  ] Buscando gravetos...", d: 500 },
  { t: "", d: 400 },

  { t: "Sistema selecionado. Reiniciando...", d: 900, style: "warn" },
  { t: "", d: 500 },

  { t: "⚠ AVISO:", d: 600, style: "warn" },
  { t: "  os dados do sistema anterior", d: 600, style: "warn" },
  { t: "  foram preservados como memória.", d: 600, style: "warn" },
  { t: "  Nada é realmente perdido.", d: 600, style: "warn" },
  { t: "  Nem a k1tty.", d: 800, style: "warn" },
  { t: "  Nem a miau.", d: 800, style: "warn" },
  { t: "  Nem você.", d: 900, style: "warn" },
  { t: "", d: 500 },

  { t: "Boa sorte na próxima encarnação.", d: 1000, style: "big" },
  { t: "woof.", d: 1400, style: "big" },
];

export default function OSSwitchOverlay() {
  const { dispatch } = useGame();
  const { width } = useWindowDimensions();
  const [n, setN] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (n >= LINES.length) return;
    const t = setTimeout(() => setN((c) => c + 1), LINES[n].d);
    return () => clearTimeout(t);
  }, [n]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [n]);

  useEffect(() => {
    if (n < LINES.length) return;
    if (firedRef.current) return;
    firedRef.current = true;
    const t = setTimeout(() => dispatch({ type: "END_OS_SWITCH" }), 3000);
    return () => clearTimeout(t);
  }, [n, dispatch]);

  const fontSize = width < 400 ? 13 : 15;
  const asciiFontSize = width < 400 ? 11 : 13;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {LINES.slice(0, n).map((l, i) => {
          const s = l.style;
          if (s === "ascii") {
            return (
              <Text
                key={i}
                style={[
                  styles.ascii,
                  { fontSize: asciiFontSize, lineHeight: asciiFontSize * 1.15 },
                ]}
              >
                {l.t}
              </Text>
            );
          }
          return (
            <Text
              key={i}
              style={[
                styles.line,
                { fontSize },
                s === "warn" && styles.warn,
                s === "info" && styles.info,
                s === "dim" && styles.dim,
                s === "big" && [styles.big, { fontSize: fontSize + 6 }],
              ]}
            >
              {l.t}
            </Text>
          );
        })}
        {n < LINES.length && (
          <Text style={[styles.cursor, { fontSize }]}>█</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  content: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  line: {
    color: "#c0c0c0",
    fontFamily: "monospace",
    lineHeight: 22,
    marginBottom: 2,
  },
  info: {
    color: "#e0e0e0",
    fontStyle: "italic",
  },
  dim: {
    color: "#606060",
    fontSize: 12,
  },
  warn: {
    color: "#cba6f7",
    fontWeight: "bold",
  },
  big: {
    color: "#C7EF00",
    fontWeight: "bold",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 8,
  },
  ascii: {
    color: "#95C623",
    fontFamily: "monospace",
    marginTop: 12,
    marginBottom: 12,
    textShadowColor: "#95C623",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  cursor: {
    color: "#c0c0c0",
  },
});
