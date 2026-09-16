// src/game/viewers/AdminPanel.tsx
// Painel admin - legivel, mobile-first.

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { PACKAGE_IDS } from "../commands/packages";
import Emoji from "../components/Emoji";
import { ACHIEVEMENTS } from "../data/achievements";
import {
  notifyError,
  notifySuccess,
  notifyWarning,
  tapLight,
} from "../services/haptics";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";
import { DEFAULT_THEME_ID, THEMES } from "../theme/themes";

const PASSWORD = "Penny";

/* ============================================================
   ActionButton — emoji separado do texto monospace
   ============================================================ */
function ActionButton({
  label,
  emoji,
  onPress,
  color,
  filled,
  small,
  disabled,
  theme,
}: any) {
  const c = color || theme.colors.command;
  const borderColor = disabled ? theme.colors.dim : c;
  const textColor = disabled ? theme.colors.dim : filled ? theme.colors.bg : c;
  const bgColor = filled && !disabled ? c : "transparent";

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      hitSlop={8}
      android_ripple={{ color: c + "30" }}
      style={{
        paddingHorizontal: small ? 14 : 16,
        paddingVertical: small ? 10 : 12,
        backgroundColor: bgColor,
        borderWidth: 1,
        borderColor,
        borderRadius: 5,
        marginRight: 8,
        marginBottom: 8,
        minHeight: 44,
        justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {emoji ? <Emoji size={13}>{emoji}</Emoji> : null}
        <Text
          style={{
            color: textColor,
            fontFamily: "monospace",
            fontSize: small ? 12.5 : 13.5,
            fontWeight: "bold",
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

/* ============================================================
   Toggle
   ============================================================ */
function Toggle({ label, isActive, onToggle, color, theme }: any) {
  const c = color || theme.colors.command;
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border + "30",
        gap: 12,
      }}
    >
      <Text
        style={{
          flex: 1,
          color: isActive ? theme.colors.text : theme.colors.dim,
          fontFamily: "monospace",
          fontSize: 13.5,
          lineHeight: 19,
        }}
      >
        {label}
      </Text>
      <Pressable
        onPress={onToggle}
        hitSlop={4}
        android_ripple={{ color: c + "30" }}
        style={{
          paddingHorizontal: 18,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: isActive ? c : theme.colors.dim,
          backgroundColor: isActive ? c : "transparent",
          borderRadius: 5,
          minWidth: 76,
          minHeight: 40,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: isActive ? theme.colors.bg : theme.colors.dim,
            fontFamily: "monospace",
            fontSize: 12.5,
            fontWeight: "bold",
            letterSpacing: 1,
          }}
        >
          {isActive ? "ON" : "OFF"}
        </Text>
      </Pressable>
    </View>
  );
}

/* ============================================================
   Section
   ============================================================ */
function Section({ title, color, defaultOpen, children, theme }: any) {
  const [open, setOpen] = useState<boolean>(defaultOpen !== false);
  const c = color || theme.colors.command;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: c + "50",
        borderRadius: 6,
        marginBottom: 14,
        overflow: "hidden",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
      }}
    >
      <Pressable
        onPress={() => setOpen((o) => !o)}
        hitSlop={4}
        android_ripple={{ color: c + "30" }}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: c + "18",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 46,
        }}
      >
        <Text
          style={{
            color: c,
            fontFamily: "monospace",
            fontSize: 13.5,
            fontWeight: "bold",
            letterSpacing: 1.8,
          }}
        >
          {title}
        </Text>
        <Text style={{ color: c, fontSize: 14, opacity: 0.8 }}>
          {open ? "\u25BE" : "\u25B8"}
        </Text>
      </Pressable>

      {open && <View style={{ padding: 14 }}>{children}</View>}
    </View>
  );
}

/* ============================================================
   StatCard
   ============================================================ */
function StatCard({ label, value, color, theme }: any) {
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: "30%",
        minWidth: 110,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: theme.colors.border + "40",
        borderRadius: 5,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          color: theme.colors.dim,
          fontFamily: "monospace",
          fontSize: 10,
          letterSpacing: 1,
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: color || theme.colors.command,
          fontFamily: "monospace",
          fontSize: 15,
          fontWeight: "bold",
        }}
        numberOfLines={1}
      >
        {String(value)}
      </Text>
    </View>
  );
}

/* ============================================================
   Login
   ============================================================ */
function AdminLogin({ onSuccess, theme }: any) {
  const [pw, setPw] = useState<string>("");
  const [err, setErr] = useState<string>("");

  const submit = () => {
    if (pw === PASSWORD) {
      notifySuccess();
      onSuccess();
    } else {
      notifyError();
      setErr("Access denied.");
      setPw("");
      setTimeout(() => setErr(""), 2000);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: theme.colors.bgDeep,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          borderWidth: 1,
          borderColor: theme.colors.error,
          paddingHorizontal: 14,
          paddingVertical: 5,
          borderRadius: 3,
          marginBottom: 18,
        }}
      >
        <Emoji size={12}>{"\u26A0"}</Emoji>
        <Text
          style={{
            color: theme.colors.error,
            fontFamily: "monospace",
            fontSize: 11,
            letterSpacing: 3,
            fontWeight: "bold",
          }}
        >
          RESTRICTED AREA
        </Text>
      </View>

      <Text
        style={{
          color: theme.colors.command,
          fontFamily: "monospace",
          fontSize: 26,
          fontWeight: "bold",
          letterSpacing: 6,
          marginBottom: 8,
          textShadowColor: theme.colors.command,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 12,
        }}
      >
        k1tty
      </Text>
      <Text
        style={{
          color: theme.colors.dim,
          fontFamily: "monospace",
          fontSize: 11,
          letterSpacing: 3,
          marginBottom: 32,
        }}
      >
        AUTHENTICATION REQUIRED
      </Text>

      <TextInput
        style={{
          width: "85%",
          maxWidth: 340,
          borderWidth: 2,
          borderColor: err ? theme.colors.error : theme.colors.border,
          borderRadius: 6,
          paddingHorizontal: 16,
          paddingVertical: 14,
          color: theme.colors.command,
          fontFamily: "monospace",
          fontSize: 17,
          letterSpacing: 6,
          textAlign: "center",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          minHeight: 52,
        }}
        value={pw}
        onChangeText={(v) => {
          setPw(v);
          if (err) setErr("");
        }}
        onSubmitEditing={submit}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholder=""
        placeholderTextColor={theme.colors.dim}
        returnKeyType="go"
      />

      <Text
        style={{
          marginTop: 16,
          fontFamily: "monospace",
          fontSize: 13,
          color: theme.colors.error,
          fontWeight: "bold",
          minHeight: 22,
          letterSpacing: 2,
        }}
      >
        {err ? "\u2717 " + err : ""}
      </Text>

      <Text
        style={{
          marginTop: 24,
          color: theme.colors.dim,
          fontFamily: "monospace",
          fontSize: 11,
          letterSpacing: 1,
          opacity: 0.6,
          textAlign: "center",
          lineHeight: 18,
        }}
      >
        pressione Enter para continuar{"\n"}
        k1tty systems . v1.0
      </Text>
    </View>
  );
}

/* ============================================================
   Painel principal
   ============================================================ */
export default function AdminPanel() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const [authed, setAuthed] = useState<boolean>(false);
  const [achFilter, setAchFilter] = useState<string>("all");
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    setAuthed(false);
  }, [state.currentSave]);

  const flash = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2000);
  };

  const unlockAllPackages = () => {
    notifySuccess();
    dispatch({ type: "INSTALL_ALL_PACKAGES", payload: PACKAGE_IDS });
    dispatch({ type: "SET_WIFI_CONNECTED", payload: true });
    flash("\u2713 " + PACKAGE_IDS.length + " pacotes instalados");
  };

  const unlockAllAchievements = () => {
    notifySuccess();
    ACHIEVEMENTS.forEach((a) => {
      if (state.unlockedAchievements.indexOf(a.id) < 0) {
        dispatch({ type: "UNLOCK_ACHIEVEMENT", payload: a.id });
      }
    });
    flash("\u2713 Conquistas desbloqueadas");
  };

  const resetAchievements = () => {
    notifyWarning();
    dispatch({ type: "CLEAR_PENDING_UNLOCKS" });
    dispatch({ type: "RESET_PROGRESS" });
    flash("Conquistas resetadas");
  };

  const triggerAchievement = (id: string) => {
    tapLight();
    dispatch({ type: "UNLOCK_ACHIEVEMENT", payload: id });
  };

  const cycleTheme = () => {
    tapLight();
    const i = THEMES.findIndex(
      (t) => t.id === (state.theme || DEFAULT_THEME_ID),
    );
    dispatch({
      type: "SET_THEME",
      payload: THEMES[(i + 1) % THEMES.length].id,
    });
  };

  const randomTheme = () => {
    tapLight();
    dispatch({
      type: "SET_THEME",
      payload: THEMES[Math.floor(Math.random() * THEMES.length)].id,
    });
  };

  const resetTheme = () => {
    tapLight();
    dispatch({ type: "SET_THEME", payload: DEFAULT_THEME_ID });
  };

  const setProgress = (v: number) => {
    tapLight();
    dispatch({ type: "SET_PROGRESS", payload: v });
  };

  const triggerVictory = () => {
    notifySuccess();
    dispatch({ type: "OPEN_WINDOW", payload: "credits" });
  };

  const triggerCatsOnly = () => {
    notifySuccess();
    dispatch({ type: "START_FINALE" });
  };

  const triggerMiauFinale = () => {
    notifySuccess();
    const w = state.openWindows.find((x: any) => x.type === "admin");
    if (w) dispatch({ type: "CLOSE_WINDOW", payload: w.id });
    setTimeout(() => dispatch({ type: "START_MIAU_FINALE" }), 300);
  };

  const triggerMiauRage = () => {
    notifyError();
    dispatch({ type: "MIAU_RAGE_END" });
    dispatch({ type: "CORRUPT_SYSTEM", payload: { source: "miau" } });
  };

  const triggerCorruption = () => {
    notifyError();
    dispatch({ type: "CORRUPT_SYSTEM", payload: { source: "user" } });
  };

  const triggerOSSwitch = () => {
    notifyWarning();
    const w = state.openWindows.find((x: any) => x.type === "admin");
    if (w) dispatch({ type: "CLOSE_WINDOW", payload: w.id });
    setTimeout(() => dispatch({ type: "START_OS_SWITCH" }), 300);
  };

  const isReqOn = (flag: string) =>
    !(state.flags && state.flags[flag] === false);

  const toggleReq = (flag: string) => {
    tapLight();
    const currently = isReqOn(flag);
    dispatch({ type: "SET_FLAG", payload: { flag, value: !currently } });
  };

  const isFlagOn = (flag: string) => state.flags && state.flags[flag] === true;

  const toggleFlag = (flag: string) => {
    tapLight();
    dispatch({ type: "SET_FLAG", payload: { flag, value: !isFlagOn(flag) } });
  };

  const doReboot = () => {
    notifyWarning();
    dispatch({ type: "REBOOT_FORCE" });
  };

  const nukeEverything = () => {
    notifyWarning();
    Alert.alert("Apagar tudo?", "Isso apaga TODOS os saves. Continuar?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          notifyError();
          try {
            const AsyncStorage =
              require("@react-native-async-storage/async-storage").default;
            await AsyncStorage.clear();
          } catch {}
          dispatch({ type: "REBOOT_FORCE" });
        },
      },
    ]);
  };

  const unlockedCount = (state.unlockedAchievements || []).length;
  const totalAch = ACHIEVEMENTS.length;

  const achFiltered = useMemo(() => {
    if (achFilter === "unlocked")
      return ACHIEVEMENTS.filter(
        (a) => state.unlockedAchievements.indexOf(a.id) >= 0,
      );
    if (achFilter === "locked")
      return ACHIEVEMENTS.filter(
        (a) => state.unlockedAchievements.indexOf(a.id) < 0,
      );
    return ACHIEVEMENTS;
  }, [achFilter, state.unlockedAchievements]);

  const flagEntries = Object.entries(state.flags || {});

  if (!authed)
    return <AdminLogin onSuccess={() => setAuthed(true)} theme={theme} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgPanel }}>
      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {feedback ? (
          <View
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 5,
              backgroundColor: theme.colors.command + "20",
              borderWidth: 1,
              borderColor: theme.colors.command,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: theme.colors.command,
                fontFamily: "monospace",
                fontSize: 13,
                fontWeight: "bold",
              }}
            >
              {feedback}
            </Text>
          </View>
        ) : null}

        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            marginBottom: 14,
            gap: 10,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                color: theme.colors.command,
                fontFamily: "monospace",
                fontSize: 16,
                fontWeight: "bold",
                letterSpacing: 3,
                textShadowColor: theme.colors.command,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 6,
              }}
            >
              ADMIN PANEL
            </Text>
            <Text
              style={{
                color: theme.colors.dim,
                fontFamily: "monospace",
                fontSize: 11,
                letterSpacing: 2,
                marginTop: 4,
              }}
            >
              k1tty systems . v1.0 . autenticado
            </Text>
          </View>

          <Pressable
            onPress={() => {
              tapLight();
              setAuthed(false);
            }}
            hitSlop={4}
            android_ripple={{ color: theme.colors.error + "30" }}
            style={{
              borderWidth: 1,
              borderColor: theme.colors.error,
              borderRadius: 5,
              paddingHorizontal: 14,
              paddingVertical: 10,
              minHeight: 40,
              justifyContent: "center",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Emoji size={12}>{"\u{1F512}"}</Emoji>
              <Text
                style={{
                  color: theme.colors.error,
                  fontFamily: "monospace",
                  fontSize: 12.5,
                  fontWeight: "bold",
                }}
              >
                log out
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Stats */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <StatCard
            label="Progresso"
            value={(state.progress || 0) + "%"}
            theme={theme}
          />
          <StatCard
            label="WiFi"
            value={state.wifiConnected ? "ON" : "OFF"}
            color={
              state.wifiConnected ? theme.colors.command : theme.colors.error
            }
            theme={theme}
          />
          <StatCard
            label="Pacotes"
            value={`${state.installedPackages.length}/${PACKAGE_IDS.length}`}
            theme={theme}
          />
          <StatCard
            label="Conquistas"
            value={`${unlockedCount}/${totalAch}`}
            color={theme.colors.warning}
            theme={theme}
          />
          <StatCard
            label="Snapshots"
            value={`${state.snapshots.length}/5`}
            theme={theme}
          />
          <StatCard label="Tema" value={state.theme || "neon"} theme={theme} />
          <StatCard
            label="Janelas"
            value={state.openWindows.length}
            theme={theme}
          />
          <StatCard
            label="Save"
            value={`slot ${state.currentSave}`}
            theme={theme}
          />
        </View>

        {/* ACOES RAPIDAS */}
        <Section title="\u25B8 ACOES RAPIDAS" theme={theme}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <ActionButton
              theme={theme}
              emoji={"\u{1F4E6}"}
              label="Instalar todos"
              onPress={unlockAllPackages}
            />
            <ActionButton
              theme={theme}
              emoji={"\u{1F3C6}"}
              label="Desbloquear conquistas"
              onPress={unlockAllAchievements}
              color={theme.colors.warning}
            />
            <ActionButton
              theme={theme}
              emoji={"\u{1F4F6}"}
              label="Toggle WiFi"
              onPress={() => {
                tapLight();
                dispatch({
                  type: "SET_WIFI_CONNECTED",
                  payload: !state.wifiConnected,
                });
              }}
            />
            <ActionButton
              theme={theme}
              emoji={"\u{1F3A8}"}
              label="Proximo tema"
              onPress={cycleTheme}
            />
            <ActionButton
              theme={theme}
              emoji={"\u{1F3B2}"}
              label="Tema aleatorio"
              onPress={randomTheme}
            />
            <ActionButton
              theme={theme}
              emoji={"\u21BB"}
              label="Resetar tema"
              onPress={resetTheme}
              color={theme.colors.dim}
            />
            <ActionButton
              theme={theme}
              emoji={"\u2327"}
              label="Limpar terminal"
              onPress={() => {
                tapLight();
                dispatch({ type: "CLEAR_HISTORY" });
              }}
              color={theme.colors.dim}
            />
          </View>

          <Text
            style={{
              color: theme.colors.dim,
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: 1.5,
              marginTop: 14,
              marginBottom: 8,
            }}
          >
            PROGRESSO
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {[0, 25, 50, 75, 100].map((v) => (
              <ActionButton
                key={v}
                theme={theme}
                label={`${v}%`}
                onPress={() => setProgress(v)}
                small
                color={
                  state.progress === v
                    ? theme.colors.command
                    : theme.colors.border
                }
                filled={state.progress === v}
              />
            ))}
          </View>
        </Section>

        {/* CONQUISTAS */}
        <Section
          title="\u25B8 CONQUISTAS"
          color={theme.colors.warning}
          theme={theme}
        >
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}
          >
            <ActionButton
              theme={theme}
              emoji={"\u{1F3C6}"}
              label="Desbloquear TODAS"
              onPress={unlockAllAchievements}
              color={theme.colors.warning}
              filled
            />
            <ActionButton
              theme={theme}
              emoji={"\u21BA"}
              label="Resetar"
              onPress={resetAchievements}
              color={theme.colors.error}
            />
          </View>

          <View
            style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}
          >
            {["all", "unlocked", "locked"].map((f) => (
              <ActionButton
                key={f}
                theme={theme}
                label={
                  f === "all"
                    ? `Todas (${totalAch})`
                    : f === "unlocked"
                      ? `Destravadas (${unlockedCount})`
                      : `Bloqueadas (${totalAch - unlockedCount})`
                }
                onPress={() => setAchFilter(f)}
                small
                color={
                  achFilter === f ? theme.colors.warning : theme.colors.border
                }
                filled={achFilter === f}
              />
            ))}
          </View>

          <View
            style={{
              maxHeight: 300,
              borderWidth: 1,
              borderColor: theme.colors.warning + "40",
              borderRadius: 5,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            }}
          >
            <ScrollView>
              {achFiltered.length === 0 ? (
                <Text
                  style={{
                    padding: 20,
                    textAlign: "center",
                    color: theme.colors.dim,
                    fontFamily: "monospace",
                    fontSize: 12,
                    fontStyle: "italic",
                  }}
                >
                  nenhuma conquista nesta categoria
                </Text>
              ) : (
                achFiltered.map((a) => {
                  const isOn = state.unlockedAchievements.indexOf(a.id) >= 0;
                  return (
                    <View
                      key={a.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.warning + "15",
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          alignItems: "center",
                          opacity: isOn ? 1 : 0.5,
                        }}
                      >
                        <Emoji size={18}>{a.icon}</Emoji>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            color: isOn
                              ? theme.colors.command
                              : theme.colors.text,
                            fontFamily: "monospace",
                            fontSize: 12.5,
                            fontWeight: "bold",
                          }}
                          numberOfLines={1}
                        >
                          {a.name}
                        </Text>
                        <Text
                          style={{
                            color: theme.colors.dim,
                            fontFamily: "monospace",
                            fontSize: 10.5,
                            marginTop: 3,
                          }}
                          numberOfLines={1}
                        >
                          {a.category}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => triggerAchievement(a.id)}
                        hitSlop={4}
                        android_ripple={{ color: theme.colors.warning + "30" }}
                        style={{
                          borderWidth: 1,
                          borderColor: isOn
                            ? theme.colors.dim
                            : theme.colors.warning,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 4,
                          minHeight: 36,
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: isOn
                              ? theme.colors.dim
                              : theme.colors.warning,
                            fontFamily: "monospace",
                            fontSize: 11,
                            fontWeight: "bold",
                          }}
                        >
                          {isOn ? "\u2713 repetir" : "+ dar"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </Section>

        {/* FINAIS E EVENTOS */}
        <Section
          title="\u25B8 FINAIS E EVENTOS"
          color={theme.colors.error}
          theme={theme}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <ActionButton
              theme={theme}
              emoji={"\u2B50"}
              label="Creditos (victory)"
              onPress={triggerVictory}
              color={theme.colors.command}
            />
            <ActionButton
              theme={theme}
              emoji={"\u{1F338}"}
              label="Final bom da miau"
              onPress={triggerMiauFinale}
              color="#cba6f7"
            />
            <ActionButton
              theme={theme}
              emoji={"\u{1F504}"}
              label="Trocar de SO"
              onPress={triggerOSSwitch}
              color="#88c0d0"
            />
            <ActionButton
              theme={theme}
              emoji={"\u25B6"}
              label="Pular para os gatos"
              onPress={triggerCatsOnly}
              color={theme.colors.command}
            />
            <ActionButton
              theme={theme}
              emoji={"\u{1F480}"}
              label="Raiva da miau"
              onPress={triggerMiauRage}
              color="#cba6f7"
            />
            <ActionButton
              theme={theme}
              emoji={"\u2620"}
              label="Corromper sistema"
              onPress={triggerCorruption}
              color={theme.colors.error}
            />
          </View>
        </Section>

        {/* REQUISITOS */}
        <Section
          title="\u25B8 REQUISITOS"
          color={theme.colors.border}
          theme={theme}
        >
          <Toggle
            theme={theme}
            label="Exigir sudo para apt"
            isActive={isReqOn("aptRequiresSudo")}
            onToggle={() => toggleReq("aptRequiresSudo")}
          />
          <Toggle
            theme={theme}
            label="Exigir internet para apt"
            isActive={isReqOn("aptRequiresWifi")}
            onToggle={() => toggleReq("aptRequiresWifi")}
          />
          <Toggle
            theme={theme}
            label="Exigir Bluetooth para musicas"
            isActive={isReqOn("musicRequiresBluetooth")}
            onToggle={() => toggleReq("musicRequiresBluetooth")}
          />
        </Section>

        {/* FLAGS DE DEBUG */}
        <Section
          title="\u25B8 FLAGS DE DEBUG"
          color={theme.colors.border}
          defaultOpen={false}
          theme={theme}
        >
          <Toggle
            theme={theme}
            label="Pular senhas de puzzle (sudo, m30w, TOKEN)"
            isActive={isFlagOn("skipPuzzlePasswords")}
            onToggle={() => toggleFlag("skipPuzzlePasswords")}
            color={theme.colors.warning}
          />
          <Toggle
            theme={theme}
            label="Pular pareamento Bluetooth"
            isActive={isFlagOn("skipBluetooth")}
            onToggle={() => toggleFlag("skipBluetooth")}
            color={theme.colors.warning}
          />
          <Toggle
            theme={theme}
            label="Marcar 'encontrei o /root'"
            isActive={isFlagOn("openedSecret")}
            onToggle={() => toggleFlag("openedSecret")}
          />
          <Toggle
            theme={theme}
            label="Marcar 'finais desbloqueados'"
            isActive={isFlagOn("finalUnlocked")}
            onToggle={() => toggleFlag("finalUnlocked")}
          />
          <Toggle
            theme={theme}
            label="Marcar 'fastfetch da miau'"
            isActive={isFlagOn("miauFastfetchUnlocked")}
            onToggle={() => toggleFlag("miauFastfetchUnlocked")}
            color="#cba6f7"
          />
          <Toggle
            theme={theme}
            label="Marcar 'd0ggy OS instalado'"
            isActive={isFlagOn("doggyOsUnlocked")}
            onToggle={() => toggleFlag("doggyOsUnlocked")}
            color="#95C623"
          />

          {flagEntries.length > 0 && (
            <View
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border + "30",
              }}
            >
              <Text
                style={{
                  color: theme.colors.border,
                  fontFamily: "monospace",
                  fontSize: 11,
                  letterSpacing: 1.5,
                  marginBottom: 10,
                }}
              >
                FLAGS ATIVAS ({flagEntries.length})
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
                {flagEntries.map(([k, v]) => (
                  <View
                    key={k}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      marginRight: 5,
                      marginBottom: 5,
                      borderWidth: 1,
                      borderColor:
                        (v ? theme.colors.command : theme.colors.dim) + "50",
                      borderRadius: 4,
                      backgroundColor: v
                        ? theme.colors.command + "10"
                        : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: v ? theme.colors.command : theme.colors.dim,
                        fontFamily: "monospace",
                        fontSize: 11,
                      }}
                    >
                      {k}: {v === true ? "ON" : v === false ? "OFF" : String(v)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Section>

        {/* SUDO + DEBUG */}
        <Section
          title="\u25B8 SUDO + DEBUG"
          color={theme.colors.border}
          defaultOpen={false}
          theme={theme}
        >
          <Text
            style={{
              color: theme.colors.dim,
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            SENHA DO SUDO
          </Text>
          <Text
            selectable
            style={{
              color: theme.colors.command,
              fontFamily: "monospace",
              fontSize: 15,
              padding: 14,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              borderRadius: 5,
              letterSpacing: 1.5,
              borderWidth: 1,
              borderColor: theme.colors.border + "40",
              fontWeight: "bold",
            }}
          >
            {state.sudoPassword}
          </Text>
          <Text
            style={{
              color: theme.colors.dim,
              fontFamily: "monospace",
              fontSize: 10,
              marginTop: 6,
              fontStyle: "italic",
            }}
          >
            toque e segure para selecionar
          </Text>

          <Text
            style={{
              color: theme.colors.dim,
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: 1.5,
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            DEBUG SNAPSHOT
          </Text>
          <Text
            style={{
              color: theme.colors.text,
              fontFamily: "monospace",
              fontSize: 12,
              padding: 12,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              borderRadius: 5,
              lineHeight: 18,
              borderWidth: 1,
              borderColor: theme.colors.border + "30",
            }}
          >
            {JSON.stringify(
              {
                flags: Object.keys(state.flags || {}).length,
                pacotes: state.installedPackages.length,
                conquistas: unlockedCount,
                progresso: state.progress + "%",
                finais: state.seenEndings || [],
                fsSize: JSON.stringify(state.filesystem).length + "B",
              },
              null,
              2,
            )}
          </Text>
        </Section>

        {/* ZONA DE PERIGO */}
        <Section
          title="\u25B8 ZONA DE PERIGO"
          color={theme.colors.error}
          defaultOpen={false}
          theme={theme}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <ActionButton
              theme={theme}
              emoji={"\u2715"}
              label="Fechar jogo (reboot)"
              onPress={doReboot}
              color={theme.colors.warning}
            />
            <ActionButton
              theme={theme}
              emoji={"\u2620"}
              label="Apagar TODOS os saves"
              onPress={nukeEverything}
              color={theme.colors.error}
              filled
            />
          </View>
          <Text
            style={{
              color: theme.colors.dim,
              fontFamily: "monospace",
              fontSize: 11,
              marginTop: 12,
              fontStyle: "italic",
              lineHeight: 17,
            }}
          >
            "Apagar TODOS os saves" limpa o AsyncStorage do app.
          </Text>
        </Section>
      </ScrollView>
    </View>
  );
}
