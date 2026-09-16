// src/game/viewers/MeowViewer.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Emoji from "../components/Emoji";
import { tapLight } from "../services/haptics";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";

const ASSETS_READY = false;
let MEOW_MP3 = null;
if (ASSETS_READY) {
  try {
    MEOW_MP3 = require("../../../assets/sounds/meow.mp3");
  } catch {}
}

const CAT_ASCII =
  "  /\\_/\\  \n" +
  " ( o.o ) \n" +
  "  > ^ <  \n" +
  " /|   |\\ \n" +
  "  |___|  ";

const CPS_UPGRADES = [
  {
    id: "auto_pet",
    name: "Mao Robotica",
    cps: 0.5,
    base: 15,
    icon: "\u{1F916}",
  },
  { id: "fish", name: "Petisco", cps: 3, base: 100, icon: "\u{1F41F}" },
  { id: "friend", name: "Amigo Gato", cps: 15, base: 700, icon: "\u{1F408}" },
  { id: "clowder", name: "Colonia", cps: 80, base: 4000, icon: "\u{1F431}" },
  { id: "cafe", name: "Cafe dos Gatos", cps: 400, base: 25000, icon: "\u2615" },
  {
    id: "quantum",
    name: "Gato Quantico",
    cps: 2000,
    base: 150000,
    icon: "\u269B",
  },
  {
    id: "influencer",
    name: "Gato Influencer",
    cps: 12000,
    base: 1000000,
    icon: "\u{1F4F1}",
  },
  {
    id: "space",
    name: "Gato Astronauta",
    cps: 75000,
    base: 5000000,
    icon: "\u{1F680}",
  },
];

const CLICK_UPGRADES = [
  {
    id: "strong",
    name: "Dedo de Ferro",
    bonus: 2,
    base: 50,
    icon: "\u{1F4AA}",
  },
  {
    id: "glove",
    name: "Luva de Kevlar",
    bonus: 5,
    base: 500,
    icon: "\u{1F94A}",
  },
  {
    id: "golden",
    name: "Garra Dourada",
    bonus: 50,
    base: 50000,
    icon: "\u{1F981}",
  },
];

const COST_GROWTH = 1.15;

function cost(base, owned) {
  return Math.floor(base * Math.pow(COST_GROWTH, owned));
}

function fmt(n) {
  if (!isFinite(n) || n < 0) return "0";
  if (n < 1000) return Math.floor(n).toString();
  if (n < 1e6) return (n / 1e3).toFixed(1) + "K";
  if (n < 1e9) return (n / 1e6).toFixed(1) + "M";
  if (n < 1e12) return (n / 1e9).toFixed(1) + "B";
  return (n / 1e12).toFixed(1) + "T";
}

export default function MeowViewer() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const storageKey = "k1tty_clicker_" + (state.currentSave ?? "default");

  const [pets, setPets] = useState(0);
  const [totalPets, setTotalPets] = useState(0);
  const [upgrades, setUpgrades] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [flash, setFlash] = useState(false);
  const stateRef = useRef({ pets, totalPets, upgrades });

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((raw) => {
      if (raw) {
        try {
          const s = JSON.parse(raw);
          setPets(s.pets || 0);
          setTotalPets(s.totalPets || 0);
          setUpgrades(s.upgrades || {});
        } catch {}
      }
      setLoaded(true);
    });
  }, [storageKey]);

  useEffect(() => {
    stateRef.current = { pets, totalPets, upgrades };
  }, [pets, totalPets, upgrades]);

  useEffect(() => {
    if (!loaded) return;
    const i = setInterval(() => {
      AsyncStorage.setItem(storageKey, JSON.stringify(stateRef.current)).catch(
        () => {},
      );
    }, 3000);
    return () => clearInterval(i);
  }, [loaded, storageKey]);

  const cps = useMemo(
    () =>
      CPS_UPGRADES.reduce((sum, u) => sum + (upgrades[u.id] || 0) * u.cps, 0),
    [upgrades],
  );
  const clickBonus = useMemo(
    () =>
      CLICK_UPGRADES.reduce(
        (sum, u) => sum + (upgrades[u.id] || 0) * u.bonus,
        0,
      ),
    [upgrades],
  );
  const clickValue = 1 + clickBonus;

  useEffect(() => {
    if (!loaded || cps <= 0) return;
    const i = setInterval(() => {
      setPets((p) => p + cps / 10);
      setTotalPets((p) => p + cps / 10);
    }, 100);
    return () => clearInterval(i);
  }, [loaded, cps]);

  useEffect(() => {
    if (totalPets >= 1e12 && !(state.flags && state.flags.meowTrilionario)) {
      dispatch({
        type: "SET_FLAG",
        payload: { flag: "meowTrilionario", value: true },
      });
    }
  }, [totalPets, state.flags, dispatch]);

  const playMeow = async () => {
    if (!MEOW_MP3) return;
    try {
      const { sound } = await Audio.Sound.createAsync(MEOW_MP3, {
        shouldPlay: true,
        volume: 0.3,
      });
      sound.setOnPlaybackStatusUpdate((st) => {
        if (st.didJustFinish) sound.unloadAsync().catch(() => {});
      });
    } catch {}
  };

  const handleClick = () => {
    setPets((p) => p + clickValue);
    setTotalPets((p) => p + clickValue);
    setFlash(true);
    setTimeout(() => setFlash(false), 100);
    tapLight();
    playMeow();
  };

  const buy = (u) => {
    const owned = upgrades[u.id] || 0;
    const c = cost(u.base, owned);
    if (pets < c) return;
    setPets((p) => p - c);
    setUpgrades((prev) => ({ ...prev, [u.id]: owned + 1 }));
  };

  const resetGame = () => {
    setPets(0);
    setTotalPets(0);
    setUpgrades({});
    AsyncStorage.removeItem(storageKey).catch(() => {});
  };

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Emoji size={14}>{"\u{1F43E}"}</Emoji>
          <Text style={styles.brand}>k1tty Clicker</Text>
        </View>
        <Text style={styles.cpsText}>{cps > 0 ? fmt(cps) + "/s" : "0/s"}</Text>
      </View>

      <View style={styles.counterBox}>
        <Text style={styles.counter}>{fmt(pets)}</Text>
        <Text style={styles.counterSub}>
          {"+" +
            fmt(clickValue) +
            " por clique  .  " +
            fmt(totalPets) +
            " total"}
        </Text>
      </View>

      <Pressable
        onPress={handleClick}
        style={[styles.catBtn, flash && styles.catBtnFlash]}
      >
        <Text style={styles.catText}>{CAT_ASCII}</Text>
      </Pressable>

      <ScrollView style={{ flex: 1, marginTop: 8 }}>
        <Text style={styles.section}>CPS</Text>
        {CPS_UPGRADES.map((u) => {
          const owned = upgrades[u.id] || 0;
          const c = cost(u.base, owned);
          const can = pets >= c;
          return (
            <Pressable
              key={u.id}
              onPress={() => buy(u)}
              disabled={!can}
              style={[styles.item, !can && { opacity: 0.5 }]}
            >
              <View style={{ marginRight: 8 }}>
                <Emoji size={20}>{u.icon}</Emoji>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {u.name}
                  {owned > 0 ? " x" + owned : ""}
                </Text>
                <Text style={styles.itemSub}>{"+" + u.cps + "/s"}</Text>
              </View>
              <Text
                style={[styles.itemCost, !can && { color: theme.colors.error }]}
              >
                {fmt(c)}
              </Text>
            </Pressable>
          );
        })}

        <Text style={styles.section}>CLIQUE</Text>
        {CLICK_UPGRADES.map((u) => {
          const owned = upgrades[u.id] || 0;
          const c = cost(u.base, owned);
          const can = pets >= c;
          return (
            <Pressable
              key={u.id}
              onPress={() => buy(u)}
              disabled={!can}
              style={[styles.item, !can && { opacity: 0.5 }]}
            >
              <View style={{ marginRight: 8 }}>
                <Emoji size={20}>{u.icon}</Emoji>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {u.name}
                  {owned > 0 ? " x" + owned : ""}
                </Text>
                <Text style={styles.itemSub}>
                  {"+" + u.bonus + " por clique"}
                </Text>
              </View>
              <Text
                style={[styles.itemCost, !can && { color: theme.colors.error }]}
              >
                {fmt(c)}
              </Text>
            </Pressable>
          );
        })}

        <Pressable onPress={resetGame} style={styles.resetBtn}>
          <Text style={styles.resetText}>resetar progresso</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function makeStyles(t) {
  return StyleSheet.create({
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 6,
      marginBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border + "40",
    },
    brand: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "bold",
    },
    cpsText: {
      color: t.colors.border,
      fontFamily: "monospace",
      fontSize: 10,
    },
    counterBox: {
      alignItems: "center",
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 4,
      backgroundColor: t.colors.bgDeep,
      marginBottom: 10,
    },
    counter: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 22,
      fontWeight: "bold",
    },
    counterSub: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 9,
      marginTop: 2,
    },
    catBtn: {
      alignSelf: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderWidth: 2,
      borderColor: t.colors.border,
      borderRadius: 12,
      backgroundColor: t.colors.bgDeep,
    },
    catBtnFlash: { backgroundColor: t.colors.command + "30" },
    catText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 12,
      lineHeight: 14,
    },
    section: {
      color: t.colors.border,
      fontFamily: "monospace",
      fontSize: 10,
      letterSpacing: 2,
      marginTop: 10,
      marginBottom: 4,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: t.colors.border + "40",
      borderRadius: 3,
      marginBottom: 4,
    },
    itemName: {
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: "bold",
    },
    itemSub: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 9,
    },
    itemCost: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: "bold",
    },
    resetBtn: {
      marginTop: 16,
      alignSelf: "center",
      borderWidth: 1,
      borderColor: t.colors.error,
      borderRadius: 3,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    resetText: {
      color: t.colors.error,
      fontFamily: "monospace",
      fontSize: 10,
    },
  });
}
