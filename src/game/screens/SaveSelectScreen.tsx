// src/game/screens/SaveSelectScreen.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PACKAGE_IDS } from "../commands/packages";
import CRTOverlay from "../components/CRTOverlay";
import Emoji from "../components/Emoji";
import MatrixBackground from "../components/MatrixBackground";
import SpriteAvatar from "../components/SpriteAvatar";
import TouchRipple from "../components/TouchRipple";
import { ACHIEVEMENTS } from "../data/achievements";
import {
  notifyError,
  notifySuccess,
  notifyWarning,
  tapLight,
} from "../services/haptics";
import { isSoundsMuted, setSoundsMuted } from "../services/uiSounds";
import { deleteSaveSlot, getSaveForSlot, useGame } from "../state/GameContext";

const SLOT_COUNT = 3;
const HOLD_DURATION = 900;
const SUPPORTS_HOVER = Platform.OS === "web";

const C = {
  bg: "#001519",
  bgPanel: "rgba(0, 26, 29, 0.92)",
  command: "#C7EF00",
  border: "#95C623",
  text: "#FFFBFA",
  dim: "#5a7a5a",
  error: "#EF6461",
  errorDim: "rgba(239, 100, 97, 0.18)",
};

const PHRASES = [
  "oi! bem-vind@ de volta",
  "pronto pra mais uma sessao?",
  "nao mexe nos meus arquivos, ta?",
  "voce demorou...",
  "to com sono. voce tambem?",
  "queria um petisco",
  "sua vez. escolhe um save.",
  "sabe que eu nao mordo, ne?",
  "meow. e isso. so meow.",
  "eu gosto quando voce volta",
  "boa sorte com o /root",
  "lembra de fazer backup!",
  "to de olho",
  "nao me deixa brava, ok?",
  "cuidado com o rm -rf",
  "nem todo gato mia. alguns digitam.",
  "eu sei onde voce mora",
];

export default function SaveSelectScreen() {
  const { dispatch } = useGame();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [saves, setSaves] = useState({});
  const [phrase, setPhrase] = useState(null);
  const [phraseKey, setPhraseKey] = useState(0);
  const [isTalking, setIsTalking] = useState(false);
  const [muted, setMuted] = useState(isSoundsMuted());

  const [pendingNewSlot, setPendingNewSlot] = useState(null);
  const [pendingDeleteSlot, setPendingDeleteSlot] = useState(null);

  const headerIn = useRef(new Animated.Value(0)).current;
  const slotsIn = useRef(new Animated.Value(0)).current;
  const titlePulse = useRef(new Animated.Value(0)).current;
  const avatarBreathe = useRef(new Animated.Value(0)).current;
  const avatarJump = useRef(new Animated.Value(0)).current;
  const avatarTalking = useRef(new Animated.Value(0)).current;

  const refresh = useCallback(() => {
    const next = {};
    for (let i = 0; i < SLOT_COUNT; i++) {
      const s = getSaveForSlot(String(i));
      if (s) next[i] = s;
    }
    setSaves(next);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    Animated.timing(headerIn, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const t = setTimeout(() => {
      Animated.timing(slotsIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 180);
    return () => clearTimeout(t);
  }, [headerIn, slotsIn]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(titlePulse, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(titlePulse, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [titlePulse]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarBreathe, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(avatarBreathe, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [avatarBreathe]);

  const handleSlotPress = (slot: number) => {
    tapLight();
    const save = saves[slot];
    if (save) {
      dispatch({ type: "LOAD_SLOT", payload: { ...save, currentSave: slot } });
    } else {
      setPendingNewSlot(slot);
    }
  };

  const handleConfirmNew = (skipTutorial: boolean) => {
    if (pendingNewSlot === null) return;
    const slot = pendingNewSlot;
    notifySuccess();
    setPendingNewSlot(null);
    dispatch({ type: "NEW_SAVE", payload: { slot, skipTutorial } });
  };

  const handleDeleteRequest = (slot: number) => {
    if (!saves[slot]) return;
    notifyWarning();
    setPendingDeleteSlot(slot);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteSlot === null) return;
    const slot = pendingDeleteSlot;
    notifyError();
    setPendingDeleteSlot(null);
    await deleteSaveSlot(String(slot));
    refresh();
  };

  const handleMeow = () => {
    tapLight();
    setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
    setPhraseKey((k) => k + 1);

    setIsTalking(true);
    Animated.timing(avatarTalking, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.timing(avatarTalking, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsTalking(false));
    }, 700);

    avatarJump.setValue(0);
    Animated.sequence([
      Animated.timing(avatarJump, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(avatarJump, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => setPhrase(null), 3400);
  };

  const toggleMute = () => {
    tapLight();
    const next = !muted;
    setMuted(next);
    setSoundsMuted(next);
  };

  const styles = useMemo(() => makeStyles(isLandscape), [isLandscape]);

  const titleGlow = titlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 22],
  });
  const breatheScale = avatarBreathe.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });
  const jumpY = avatarJump.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -16],
  });
  const talkingScale = avatarTalking.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <TouchRipple>
      <View style={styles.container}>
        <MatrixBackground />

        <SoundButton muted={muted} onPress={toggleMute} top={insets.top + 12} />

        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 30 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.headerRow,
              {
                opacity: headerIn,
                transform: [
                  {
                    translateY: headerIn.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.avatarWrap}>
              {phrase && <Bubble key={phraseKey} text={phrase} />}
              <Pressable
                onPress={handleMeow}
                hitSlop={16}
                style={styles.avatarBtn}
              >
                <Animated.View
                  style={{
                    transform: [
                      { translateY: jumpY },
                      { scale: Animated.multiply(breatheScale, talkingScale) },
                    ],
                  }}
                >
                  <SpriteAvatar
                    talking={isTalking}
                    size={isLandscape ? 80 : 96}
                  />
                </Animated.View>
              </Pressable>
            </View>

            <View style={styles.titleWrap}>
              <Animated.Text
                style={[styles.title, { textShadowRadius: titleGlow }]}
              >
                k1tty
              </Animated.Text>
              <View style={styles.underline} />
              <Text style={styles.subtitle}>TERMINAL GAME · v1.0.0</Text>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: slotsIn }}>
            {Array.from({ length: SLOT_COUNT }).map((_, i) => (
              <SaveSlot
                key={i}
                index={i}
                save={saves[i]}
                onPress={() => handleSlotPress(i)}
                onDeleteRequest={() => handleDeleteRequest(i)}
              />
            ))}
          </Animated.View>

          <Text style={styles.footer}>k1tty Systems · 2025</Text>
        </ScrollView>

        <CRTOverlay />

        <NewSaveModal
          visible={pendingNewSlot !== null}
          slot={pendingNewSlot ?? 0}
          onSkipTutorial={() => handleConfirmNew(true)}
          onWithTutorial={() => handleConfirmNew(false)}
          onCancel={() => setPendingNewSlot(null)}
        />

        <ConfirmModal
          visible={pendingDeleteSlot !== null}
          title={`Apagar sessao ${String((pendingDeleteSlot ?? 0) + 1).padStart(2, "0")}?`}
          message={
            pendingDeleteSlot !== null && saves[pendingDeleteSlot]
              ? `Progresso: ${saves[pendingDeleteSlot].progress || 0}%.\n\nIsso nao pode ser desfeito.`
              : ""
          }
          confirmLabel="APAGAR"
          cancelLabel="CANCELAR"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDeleteSlot(null)}
        />
      </View>
    </TouchRipple>
  );
}

function SoundButton({ muted, onPress, top }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: pressed ? 0.92 : hovered ? 1.08 : 1,
      friction: 6,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [hovered, pressed, scale]);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      hitSlop={12}
      style={{ position: "absolute", right: 16, top, zIndex: 100 }}
    >
      <Animated.View
        style={[
          soundStyles.btn,
          hovered && soundStyles.btnHovered,
          pressed && soundStyles.btnPressed,
          { transform: [{ scale }] },
        ]}
      >
        <Emoji size={20}>{muted ? "\u{1F507}" : "\u{1F50A}"}</Emoji>
      </Animated.View>
    </Pressable>
  );
}

const soundStyles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnHovered: {
    borderColor: C.command,
    backgroundColor: "rgba(0, 40, 45, 0.9)",
    shadowColor: C.command,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  btnPressed: {
    borderColor: C.command,
    backgroundColor: "rgba(199, 239, 0, 0.2)",
  },
});

function Bubble({ text }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 6,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  return (
    <Animated.View
      style={[
        bubbleStyles.bubble,
        { opacity: anim, transform: [{ scale }, { translateX }] },
      ]}
    >
      <Text style={bubbleStyles.text}>{text}</Text>
      <View style={bubbleStyles.tailOuter} />
      <View style={bubbleStyles.tailInner} />
    </Animated.View>
  );
}

const bubbleStyles = StyleSheet.create({
  bubble: {
    position: "absolute",
    right: "100%",
    marginRight: 12,
    top: "50%",
    marginTop: -22,
    width: 150,
    backgroundColor: C.bgPanel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 10,
  },
  text: {
    color: C.text,
    fontFamily: "monospace",
    fontSize: 10.5,
    lineHeight: 14,
    textAlign: "center",
  },
  tailOuter: {
    position: "absolute",
    right: -10,
    top: "50%",
    marginTop: -8,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: "transparent",
    borderBottomWidth: 8,
    borderBottomColor: "transparent",
    borderLeftWidth: 9,
    borderLeftColor: C.border,
  },
  tailInner: {
    position: "absolute",
    right: -8,
    top: "50%",
    marginTop: -7,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderTopColor: "transparent",
    borderBottomWidth: 7,
    borderBottomColor: "transparent",
    borderLeftWidth: 8,
    borderLeftColor: C.bgPanel,
  },
});

function SaveSlot({ index, save, onPress, onDeleteRequest }) {
  const isEmpty = !save;
  const slotId = String(index + 1).padStart(2, "0");

  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [holding, setHolding] = useState(false);

  const styles = useMemo(() => makeStyles(false), []);

  const enterAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const liftY = useRef(new Animated.Value(0)).current;
  const holdProgress = useRef(new Animated.Value(0)).current;
  const longPressRef = useRef(false);
  const animRef = useRef(null);

  useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 400,
      delay: 100 + index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enterAnim, index]);

  useEffect(() => {
    if (isEmpty) return;
    const loop = Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [isEmpty, scanAnim]);

  useEffect(() => {
    Animated.spring(pressScale, {
      toValue: pressed ? 0.97 : 1,
      friction: 6,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [pressed, pressScale]);

  useEffect(() => {
    if (!SUPPORTS_HOVER) return;
    Animated.spring(liftY, {
      toValue: hovered && !pressed ? -3 : 0,
      friction: 7,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }, [hovered, pressed, liftY]);

  const startHold = () => {
    if (isEmpty) return;
    longPressRef.current = true;
    setHolding(true);
    holdProgress.setValue(0);

    animRef.current = Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animRef.current.start(({ finished }) => {
      if (finished) {
        setHolding(false);
        holdProgress.setValue(0);
        onDeleteRequest();
      }
      setTimeout(() => {
        longPressRef.current = false;
      }, 100);
    });
  };

  const cancelHold = () => {
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }
    if (holding) {
      setHolding(false);
      holdProgress.setValue(0);
    }
  };

  const handlePress = () => {
    if (longPressRef.current) return;
    onPress();
  };

  const translateY = enterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const barWidth = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      style={{
        opacity: enterAnim,
        transform: [
          { translateY: Animated.add(translateY, liftY) },
          { scale: pressScale },
        ],
        marginBottom: 14,
      }}
    >
      <Pressable
        onPress={handlePress}
        onLongPress={startHold}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => {
          setPressed(false);
          cancelHold();
        }}
        delayLongPress={150}
        style={[
          styles.slot,
          isEmpty ? styles.slotEmpty : styles.slotFilled,
          hovered && !pressed && !holding && styles.slotHovered,
          pressed && !holding && styles.slotPressed,
          holding && styles.slotHolding,
        ]}
      >
        {holding && (
          <Animated.View style={[styles.holdBar, { width: barWidth }]} />
        )}

        <View
          style={[
            styles.slotSideBar,
            { backgroundColor: isEmpty ? C.dim + "60" : C.command },
          ]}
        />

        {(hovered || pressed) && !isEmpty && !holding && (
          <>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </>
        )}

        <View style={styles.slotHeader}>
          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeText}>{slotId}</Text>
          </View>
          <Text
            style={[styles.slotName, { color: isEmpty ? C.dim : C.command }]}
          >
            SESSION {slotId}
          </Text>
          {!isEmpty && (
            <Text style={styles.slotPercent}>{save.progress || 0}%</Text>
          )}
          {isEmpty && <Text style={styles.slotEmptyTag}>VAZIA</Text>}
        </View>

        {isEmpty ? (
          <View style={styles.emptyContent}>
            <Text style={styles.emptyHint}>toque para iniciar</Text>
          </View>
        ) : (
          <View>
            <View style={styles.progressWrap}>
              <View
                style={[
                  styles.progressFill,
                  { width: (save.progress || 0) + "%" },
                ]}
              >
                {(save.progress || 0) > 4 && (
                  <Animated.View
                    style={[
                      styles.scanline,
                      {
                        transform: [
                          {
                            translateX: scanAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-20, 300],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                )}
              </View>
            </View>

            <View style={styles.statsGrid}>
              <Stat
                styles={styles}
                icon={"\u{1F4E6}"}
                label="PACOTES"
                value={`${(save.installedPackages || []).length}/${PACKAGE_IDS.length}`}
              />
              <Stat
                styles={styles}
                icon={"\u{1F3C6}"}
                label="CONQUISTAS"
                value={`${(save.unlockedAchievements || []).length}/${ACHIEVEMENTS.length}`}
              />
              <Stat
                styles={styles}
                icon={"\u2328"}
                label="COMANDOS"
                value={String(save.stats?.commandsRun || 0)}
              />
              <Stat
                styles={styles}
                icon={"\u{1F4F6}"}
                label="WIFI"
                value={save.wifiConnected ? "on" : "off"}
              />
              <Stat
                styles={styles}
                icon={"\u{1F3A8}"}
                label="TEMA"
                value={save.theme || "neon"}
              />
            </View>

            <Text style={styles.slotHint}>
              {holding
                ? "continuando para apagar..."
                : "toque para carregar  ·  segure para apagar"}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function Stat({ styles, icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Emoji size={11}>{icon}</Emoji>
        <Text style={styles.statValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function NewSaveModal({
  visible,
  slot,
  onSkipTutorial,
  onWithTutorial,
  onCancel,
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      fade.setValue(0);
      slide.setValue(20);
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fade, slide]);

  if (!visible) return null;

  return (
    <Animated.View style={[modalStyles.overlay, { opacity: fade }]}>
      <Animated.View
        style={[modalStyles.box, { transform: [{ translateY: slide }] }]}
      >
        <Text style={modalStyles.title}>NOVA SESSAO</Text>
        <Text style={modalStyles.message}>
          SESSION {String(slot + 1).padStart(2, "0")} esta vazia.{"\n\n"}Como
          voce quer comecar?
        </Text>

        <ModalBtn label="COM TUTORIAL" onPress={onWithTutorial} primary />
        <ModalBtn label="SEM TUTORIAL" onPress={onSkipTutorial} />

        <Pressable onPress={onCancel} style={modalStyles.cancelBtn}>
          <Text style={modalStyles.cancelText}>cancelar</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      fade.setValue(0);
      slide.setValue(20);
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fade, slide]);

  if (!visible) return null;

  return (
    <Animated.View style={[modalStyles.overlay, { opacity: fade }]}>
      <Animated.View
        style={[modalStyles.box, { transform: [{ translateY: slide }] }]}
      >
        <Text style={[modalStyles.title, danger && { color: C.error }]}>
          {title}
        </Text>
        <Text style={modalStyles.message}>{message}</Text>
        <View style={modalStyles.row}>
          <ModalBtn label={cancelLabel} onPress={onCancel} flex />
          <ModalBtn
            label={confirmLabel}
            onPress={onConfirm}
            flex
            danger={danger}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function ModalBtn({ label, onPress, primary, danger, flex }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const borderColor = danger ? C.error : primary ? C.command : C.border;
  const borderColorHover = danger ? C.error : C.command;
  const bg = primary ? C.command : "transparent";
  const bgHover = danger
    ? "rgba(239, 100, 97, 0.15)"
    : primary
      ? "#d8ff20"
      : "rgba(199, 239, 0, 0.12)";

  return (
    <Pressable
      onPress={() => {
        tapLight();
        onPress();
      }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        modalStyles.btn,
        flex && { flex: 1, marginBottom: 0 },
        {
          borderColor: hovered ? borderColorHover : borderColor,
          backgroundColor: hovered ? bgHover : bg,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <Text
        style={[
          modalStyles.btnText,
          primary && { color: C.bg },
          danger && !primary && { color: C.error },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 24,
  },
  box: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#001a1d",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 20,
    shadowColor: C.command,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  title: {
    color: C.command,
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    color: C.text,
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginBottom: 20,
  },
  row: { flexDirection: "row", gap: 8 },
  btn: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  btnText: {
    color: C.command,
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
    minHeight: 44,
    justifyContent: "center",
  },
  cancelText: {
    color: C.dim,
    fontFamily: "monospace",
    fontSize: 10,
    fontStyle: "italic",
    letterSpacing: 1,
  },
});

function makeStyles(landscape) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    scroll: {
      paddingHorizontal: 20,
      maxWidth: landscape ? 720 : "100%",
      alignSelf: "center",
      width: "100%",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      marginBottom: 26,
      minHeight: landscape ? 100 : 130,
      paddingHorizontal: 10,
    },
    avatarWrap: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarBtn: { padding: 4 },
    titleWrap: {
      marginLeft: 22,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    title: {
      color: C.command,
      fontFamily: "monospace",
      fontSize: landscape ? 32 : 38,
      fontWeight: "bold",
      letterSpacing: landscape ? 6 : 7,
      lineHeight: landscape ? 36 : 44,
      textShadowColor: C.command,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 18,
    },
    underline: {
      width: 90,
      height: 1,
      backgroundColor: C.border,
      marginTop: 6,
      marginBottom: 6,
      opacity: 0.85,
    },
    subtitle: {
      color: C.border,
      fontFamily: "monospace",
      fontSize: 9,
      letterSpacing: 3.5,
      opacity: 0.9,
    },
    slot: {
      borderWidth: 1,
      borderRadius: 6,
      backgroundColor: C.bgPanel,
      padding: 14,
      paddingLeft: 20,
      position: "relative",
      overflow: "hidden",
    },
    slotEmpty: {
      borderStyle: "dashed",
      borderColor: C.dim + "80",
      opacity: 0.85,
    },
    slotFilled: { borderColor: C.border },
    slotHovered: {
      borderColor: C.command,
      borderStyle: "solid",
      backgroundColor: "rgba(0, 35, 40, 0.95)",
      shadowColor: C.command,
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
    },
    slotPressed: {
      borderColor: C.command,
      borderStyle: "solid",
      shadowColor: C.command,
      shadowOpacity: 0.5,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
      backgroundColor: "rgba(0, 40, 45, 0.95)",
    },
    slotHolding: {
      borderColor: C.error,
      borderStyle: "solid",
      shadowColor: C.error,
      shadowOpacity: 0.7,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 0 },
    },
    holdBar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: C.errorDim,
    },
    slotSideBar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
    },
    corner: {
      position: "absolute",
      width: 14,
      height: 14,
      borderColor: C.command,
    },
    cornerTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
    cornerTR: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
    cornerBL: {
      bottom: -1,
      left: -1,
      borderBottomWidth: 2,
      borderLeftWidth: 2,
    },
    cornerBR: {
      bottom: -1,
      right: -1,
      borderBottomWidth: 2,
      borderRightWidth: 2,
    },
    slotHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      gap: 10,
    },
    slotBadge: {
      width: 32,
      height: 32,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 3,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(199, 239, 0, 0.1)",
    },
    slotBadgeText: {
      color: C.command,
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: "bold",
      letterSpacing: 1,
    },
    slotName: {
      flex: 1,
      fontFamily: "monospace",
      fontSize: 13,
      fontWeight: "bold",
      letterSpacing: 2,
    },
    slotPercent: {
      color: C.command,
      fontFamily: "monospace",
      fontSize: 14,
      fontWeight: "bold",
    },
    slotEmptyTag: {
      color: C.dim,
      fontFamily: "monospace",
      fontSize: 9,
      letterSpacing: 2,
    },
    emptyContent: { paddingVertical: 12, alignItems: "center" },
    emptyHint: {
      color: C.dim,
      fontFamily: "monospace",
      fontSize: 11,
      fontStyle: "italic",
    },
    progressWrap: {
      height: 6,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 3,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(149, 198, 35, 0.3)",
      marginBottom: 10,
      position: "relative",
    },
    progressFill: {
      height: "100%",
      borderRadius: 2,
      position: "relative",
      overflow: "hidden",
      backgroundColor: C.command,
    },
    scanline: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: 20,
      backgroundColor: "rgba(255,255,255,0.5)",
    },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    statCard: {
      flexGrow: 1,
      flexBasis: "30%",
      minWidth: 90,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: "rgba(149, 198, 35, 0.2)",
      borderRadius: 3,
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    statLabel: {
      color: C.dim,
      fontFamily: "monospace",
      fontSize: 8,
      letterSpacing: 1,
      marginBottom: 2,
    },
    statValueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    statValue: {
      flex: 1,
      color: C.text,
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: "bold",
    },
    slotHint: {
      color: C.dim,
      fontFamily: "monospace",
      fontSize: 9,
      marginTop: 10,
      fontStyle: "italic",
    },
    footer: {
      color: C.dim,
      fontFamily: "monospace",
      fontSize: 9,
      textAlign: "center",
      marginTop: 30,
      letterSpacing: 2,
    },
  });
}
