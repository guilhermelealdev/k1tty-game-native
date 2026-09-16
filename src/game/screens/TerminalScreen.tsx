// src/game/screens/TerminalScreen.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { executeCommand } from "../commands/parser";
import AchievementToast from "../components/AchievementToast";
import CRTOverlay from "../components/CRTOverlay";
import FloatingWindow from "../components/FloatingWindow";
import Prompt from "../components/Prompt";
import TerminalChips from "../components/TerminalChips";
import TerminalLine from "../components/TerminalLine";
import { useAchievements } from "../hooks/useAchievements";
import { usePinchZoom } from "../hooks/usePinchZoom";
import { notifyError, notifySuccess, tapLight } from "../services/haptics";
import { preloadSounds } from "../services/uiSounds";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";
import MiauFastfetch from "../viewers/MiauFastfetch";
import PokemonEntry from "../viewers/PokemonEntry";
import { VIEWER_REGISTRY, VIEWER_TITLES } from "../viewers/registry";

const MAX_HIST = 30;
const BOTTOM_THRESHOLD = 60;

export default function TerminalScreen() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const pinch = usePinchZoom(1);

  const [input, setInput] = useState<string>("");
  const [pending, setPending] = useState<any>(null);
  const [hist, setHist] = useState<string[]>([]);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [isAwaiting, setIsAwaiting] = useState<boolean>(false);

  /* F1: navegacao no historico */
  const [histNavIndex, setHistNavIndex] = useState<number | null>(null);

  /* F3: usuario esta no fim? */
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const welcomedRef = useRef<boolean>(false);
  const scrollPendingRef = useRef<boolean>(false);

  /* F3: ref sincrono do estado "at bottom" para uso dentro de callbacks */
  const isAtBottomRef = useRef<boolean>(true);

  const seenIndicesRef = useRef<Set<number> | null>(null);
  if (seenIndicesRef.current === null) {
    seenIndicesRef.current = new Set(state.history.map((_, i) => i));
  }

  const inputSlide = useRef(new Animated.Value(30)).current;
  const entrance = useRef(new Animated.Value(0)).current;

  const histKey = "k1tty_hist_" + (state.currentSave ?? "default");

  useAchievements();

  useEffect(() => {
    preloadSounds().catch(() => {});
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entrance, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(inputSlide, {
        toValue: 0,
        friction: 8,
        tension: 60,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [entrance, inputSlide]);

  useEffect(() => {
    AsyncStorage.getItem(histKey).then((raw) => {
      if (raw)
        try {
          setHist(JSON.parse(raw));
        } catch {}
    });
  }, [histKey]);

  useEffect(() => {
    if (hist.length === 0) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(
        histKey,
        JSON.stringify(hist.slice(-MAX_HIST)),
      ).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [hist, histKey]);

  useEffect(() => {
    if (welcomedRef.current) return;
    welcomedRef.current = true;
    if (state.history.length > 0) return;

    const w1 = {
      command: "",
      output: "k1tty Linux 1.0.0 (tty1)",
      type: "info",
    };
    const w2 = {
      command: "",
      output:
        'Sessao restaurada. Bem-vindo de volta.\n\nDigite "help" para ver os comandos.\nSe estiver perdid@, use "whatnow".',
      type: "info",
    };
    const t1 = setTimeout(
      () => dispatch({ type: "ADD_HISTORY", payload: w1 }),
      400,
    );
    const t2 = setTimeout(
      () => dispatch({ type: "ADD_HISTORY", payload: w2 }),
      1100,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [dispatch, state.history.length]);

  /* ============================================================
     F3: scroll inteligente
     ============================================================ */
  const scrollToBottom = useCallback((animated = true, force = false) => {
    if (!force && !isAtBottomRef.current) return;
    if (scrollPendingRef.current) return;
    scrollPendingRef.current = true;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
      scrollPendingRef.current = false;
    });
  }, []);

  /* U6: callbacks estaveis para o TerminalLine memoizado */
  const handleTick = useCallback(() => {
    scrollToBottom(false, false);
  }, [scrollToBottom]);

  const handleAnimationDone = useCallback(() => {
    setAnimatingIndex(null);
    scrollToBottom(true, false);
  }, [scrollToBottom]);

  const handleScroll = useCallback((e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    const atBottom = distanceFromBottom < BOTTOM_THRESHOLD;
    if (atBottom !== isAtBottomRef.current) {
      isAtBottomRef.current = atBottom;
      setIsAtBottom(atBottom);
    }
  }, []);

  const jumpToBottom = useCallback(() => {
    isAtBottomRef.current = true;
    setIsAtBottom(true);
    scrollToBottom(true, true);
  }, [scrollToBottom]);

  useEffect(() => {
    scrollToBottom(true, false);
  }, [state.history.length, scrollToBottom]);

  useEffect(() => {
    const last = state.history.length - 1;
    if (last < 0) return;
    if (!seenIndicesRef.current) return;
    if (seenIndicesRef.current.has(last)) return;
    seenIndicesRef.current.add(last);
    setAnimatingIndex(last);
  }, [state.history.length]);

  /* ============================================================
     F1: navegacao no historico
     ============================================================ */
  const handleHistUp = useCallback(() => {
    if (hist.length === 0) return;
    const nextIndex =
      histNavIndex === null ? hist.length - 1 : Math.max(0, histNavIndex - 1);
    setHistNavIndex(nextIndex);
    setInput(hist[nextIndex] || "");
    tapLight();
  }, [hist, histNavIndex]);

  const handleHistDown = useCallback(() => {
    if (hist.length === 0) return;
    if (histNavIndex === null) return;
    const nextIndex = histNavIndex + 1;
    if (nextIndex >= hist.length) {
      setHistNavIndex(null);
      setInput("");
    } else {
      setHistNavIndex(nextIndex);
      setInput(hist[nextIndex] || "");
    }
    tapLight();
  }, [hist, histNavIndex]);

  /* ============================================================
     handleResult
     ============================================================ */
  const handleResult = useCallback(
    (result: any, cmd: string, args: string[]) => {
      if (!result) return;

      if (
        result.needsPassword ||
        result.needsUsername ||
        result.needsConfirmation
      ) {
        dispatch({
          type: "ADD_HISTORY",
          payload: {
            command: cmd + (args.length ? " " + args.join(" ") : ""),
            output: result.output,
            type: result.type || "warning",
          },
        });
        setPending({
          command: cmd,
          args,
          options: {},
          type: result.needsPassword
            ? "password"
            : result.needsUsername
              ? "username"
              : "confirmation",
        });
        return;
      }

      if (result.systemCorrupting) {
        const logs = result.removalLogs || [];
        let delay = 0;
        logs.forEach((log: string, i: number) => {
          setTimeout(() => {
            dispatch({
              type: "ADD_HISTORY",
              payload: { command: "", output: log, type: "normal" },
            });
            if (i === logs.length - 1) {
              setTimeout(() => {
                dispatch({
                  type: "ADD_HISTORY",
                  payload: {
                    command: "",
                    output: "SISTEMA CORROMPIDO",
                    type: "error",
                  },
                });
                setTimeout(
                  () =>
                    dispatch({
                      type: "CORRUPT_SYSTEM",
                      payload: { source: "user" },
                    }),
                  800,
                );
              }, 300);
            }
          }, delay);
          delay += 60;
        });
        return;
      }

      if (result.type === "error") notifyError();
      else if (result.type === "success") notifySuccess();

      dispatch({
        type: "ADD_HISTORY",
        payload: {
          command: cmd + (args.length ? " " + args.join(" ") : ""),
          output: result.output,
          type: result.type || "normal",
          special: result.special || null,
        },
      });
    },
    [dispatch],
  );

  const runCommand = useCallback(
    (cmd: string, args: string[], options: any) => {
      const fullInput = cmd + (args.length ? " " + args.join(" ") : "");

      let result;
      try {
        result = executeCommand(fullInput, state, dispatch, options || {});
      } catch (err: any) {
        result = {
          command: fullInput,
          output: "erro: " + err.message,
          type: "error",
        };
      }

      if (result && typeof result.then === "function") {
        setIsAwaiting(true);
        result
          .then((r: any) => {
            setIsAwaiting(false);
            if (!r) return;
            handleResult(r, cmd, args);
          })
          .catch((err: any) => {
            setIsAwaiting(false);
            dispatch({
              type: "ADD_HISTORY",
              payload: {
                command: fullInput,
                output: "erro: " + err.message,
                type: "error",
              },
            });
          });
        return;
      }

      handleResult(result, cmd, args);
    },
    [state, dispatch, handleResult],
  );

  const pushToHist = useCallback((cmd: string) => {
    setHist((prev) => {
      const filtered = prev.filter((c) => c !== cmd);
      return [...filtered, cmd].slice(-MAX_HIST);
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    scrollToBottom(true, true);

    if (pending) {
      const newOptions = { ...pending.options };
      if (pending.type === "password") newOptions.password = trimmed;
      else if (pending.type === "username") newOptions.username = trimmed;
      else if (pending.type === "confirmation")
        newOptions.confirmed = ["y", "s", "sim", "yes"].includes(
          trimmed.toLowerCase(),
        );

      dispatch({
        type: "ADD_HISTORY",
        payload: {
          command:
            "> " +
            (pending.type === "password"
              ? "\u2022".repeat(trimmed.length)
              : trimmed),
          output: "",
          type: "normal",
        },
      });

      const { command, args } = pending;
      setPending(null);
      setInput("");
      setHistNavIndex(null);
      runCommand(command, args, newOptions);
      return;
    }

    setInput("");
    setHistNavIndex(null);
    tapLight();
    dispatch({ type: "STAT_INCREMENT", payload: { key: "commandsRun" } });
    pushToHist(trimmed);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    runCommand(cmd, args, {});
  }, [input, pending, dispatch, pushToHist, runCommand, scrollToBottom]);

  const handleKeyPress = useCallback(
    (e: any) => {
      const key = e.nativeEvent.key;
      if (key === "ArrowUp") {
        e.preventDefault?.();
        handleHistUp();
      } else if (key === "ArrowDown") {
        e.preventDefault?.();
        handleHistDown();
      }
    },
    [handleHistUp, handleHistDown],
  );

  const displayPath =
    state.currentDirectory === "/home/k1tty"
      ? "~"
      : state.currentDirectory.replace("/home/k1tty", "~");

  const pendingLabel = pending
    ? pending.type === "password"
      ? "senha"
      : pending.type === "username"
        ? "usuario"
        : "confirmar (y/n)"
    : null;

  const canHistUp = hist.length > 0;
  const canHistDown = histNavIndex !== null;

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const renderWindow = (w: any) => {
    const Viewer = VIEWER_REGISTRY[w.type];
    if (!Viewer) return null;
    const pos = (state.windowPositions && state.windowPositions[w.id]) || {
      x: 30,
      y: 80,
      width: 320,
      height: 420,
    };
    return (
      <FloatingWindow
        key={w.id}
        id={w.id}
        title={VIEWER_TITLES[w.type] || w.type}
        position={pos}
        onClose={() => dispatch({ type: "CLOSE_WINDOW", payload: w.id })}
        onMove={(p: any) =>
          dispatch({ type: "MOVE_WINDOW", payload: { id: w.id, position: p } })
        }
        onFocus={() => dispatch({ type: "FOCUS_WINDOW", payload: w.id })}
      >
        <Viewer />
      </FloatingWindow>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { transform: [{ scale: pinch.scale }] },
          ]}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={100}
          {...pinch.handlers}
        >
          {state.history.map((entry: any, i: number) => {
            if (entry.special && entry.special.type === "miau-fastfetch") {
              return (
                <View key={i} style={{ marginBottom: 12 }}>
                  <Text style={styles.cmdLine}>
                    {"k1tty@k1tty:~$ " + entry.command}
                  </Text>
                  <MiauFastfetch line={entry.special.miauLine} />
                </View>
              );
            }
            if (entry.special && entry.special.type === "pokemon") {
              return (
                <View key={i} style={{ marginBottom: 12 }}>
                  <Text style={styles.cmdLine}>
                    {"k1tty@k1tty:~$ " + entry.command}
                  </Text>
                  <View style={{ height: 420 }}>
                    <PokemonEntry data={entry.special.data} />
                  </View>
                </View>
              );
            }
            return (
              <TerminalLine
                key={i}
                entry={entry}
                theme={theme}
                path={displayPath}
                animate={animatingIndex === i}
                onTick={handleTick}
                onAnimationDone={handleAnimationDone}
              />
            );
          })}
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* F3: botao flutuante "ir pro fim" */}
      {!isAtBottom && (
        <Pressable
          onPress={jumpToBottom}
          hitSlop={8}
          android_ripple={{ color: theme.colors.bg + "30" }}
          style={[
            styles.jumpBtn,
            {
              bottom: Math.max(80, insets.bottom + 80),
              backgroundColor: theme.colors.command,
            },
          ]}
        >
          <Text style={[styles.jumpBtnText, { color: theme.colors.bg }]}>
            {"\u25BC"}
          </Text>
        </Pressable>
      )}

      <TerminalChips
        input={input}
        commandHistory={hist}
        onPick={(cmd) => {
          setInput(cmd);
          setHistNavIndex(null);
        }}
      />

      <Animated.View
        style={[
          styles.inputBar,
          {
            transform: [{ translateY: inputSlide }],
            opacity: entrance,
            paddingBottom: Math.max(18, insets.bottom + 8),
          },
        ]}
      >
        {pending ? (
          <Text style={styles.pendingLabel}>{"[" + pendingLabel + "]"}</Text>
        ) : (
          <Prompt path={displayPath} theme={theme} />
        )}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={input}
          onChangeText={(v) => {
            setInput(v);
            if (histNavIndex !== null) setHistNavIndex(null);
          }}
          onSubmitEditing={handleSubmit}
          onKeyPress={handleKeyPress}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          placeholderTextColor={theme.colors.dim}
          returnKeyType="go"
          blurOnSubmit={false}
          secureTextEntry={pending?.type === "password"}
          editable={!isAwaiting}
          caretHidden={false}
        />

        <View style={styles.histNav}>
          <Pressable
            onPress={handleHistUp}
            disabled={!canHistUp}
            hitSlop={6}
            android_ripple={{ color: theme.colors.command + "30" }}
            style={[styles.histBtn, !canHistUp && styles.histBtnDisabled]}
          >
            <Text
              style={[
                styles.histBtnText,
                !canHistUp && { color: theme.colors.dim },
              ]}
            >
              {"\u25B2"}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleHistDown}
            disabled={!canHistDown}
            hitSlop={6}
            android_ripple={{ color: theme.colors.command + "30" }}
            style={[styles.histBtn, !canHistDown && styles.histBtnDisabled]}
          >
            <Text
              style={[
                styles.histBtnText,
                !canHistDown && { color: theme.colors.dim },
              ]}
            >
              {"\u25BC"}
            </Text>
          </Pressable>
        </View>

        {isAwaiting && <Text style={styles.awaiting}>buscando...</Text>}
      </Animated.View>

      {state.openWindows.map(renderWindow)}

      <AchievementToast />
      <CRTOverlay />
    </KeyboardAvoidingView>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    scroll: { flex: 1 },
    scrollContent: { padding: 14, paddingBottom: 24 },
    cmdLine: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 13,
      fontWeight: "bold",
      marginBottom: 4,
    },
    inputBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingTop: 16,
      backgroundColor: t.colors.bgDeep,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      gap: 4,
    },
    pendingLabel: {
      color: t.colors.warning,
      fontFamily: "monospace",
      fontSize: 16,
      fontWeight: "bold",
      textShadowColor: t.colors.warning,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 4,
    },
    input: {
      flex: 1,
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 18,
      paddingVertical: 6,
      paddingHorizontal: 4,
      textShadowColor: t.colors.command,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 3,
    },
    awaiting: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 12,
      fontStyle: "italic",
      marginLeft: 8,
    },
    histNav: {
      flexDirection: "column",
      gap: 2,
      paddingLeft: 4,
    },
    histBtn: {
      width: 32,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 4,
      borderWidth: 1,
      borderColor: t.colors.border + "60",
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    histBtnDisabled: {
      borderColor: t.colors.dim + "30",
      backgroundColor: "transparent",
    },
    histBtnText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 10,
      fontWeight: "bold",
    },
    jumpBtn: {
      position: "absolute",
      alignSelf: "center",
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.4,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 6,
    },
    jumpBtnText: {
      fontFamily: "monospace",
      fontSize: 18,
      fontWeight: "bold",
    },
  });
}
