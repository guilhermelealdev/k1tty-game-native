// src/game/viewers/CatRun.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Emoji from "../components/Emoji";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";

const W = 40;
const H = 12;
const TICK = 90;
const PLAYER_X = 4;
const BEST_KEY = "k1tty_catrun_best";

function makeCat(jumping, dead) {
  if (dead) return [" /\\_/\\ ", "( x.x )", "  ---  "];
  if (jumping) return [" /\\_/\\ ", "( ^.^ )", " /^ ^\\ "];
  return [" /\\_/\\ ", "( o.o )", "  > <  "];
}

const OBSTACLES = ["|#|", "/^\\", "_W_"];

function render(catY, obs, dead) {
  const grid = [];
  for (let y = 0; y < H; y++) grid.push(new Array(W).fill(" "));
  for (let x = 0; x < W; x++) grid[H - 1][x] = "_";

  for (const o of obs) {
    const rows = o.s.split("\n");
    for (let dy = 0; dy < rows.length; dy++) {
      const row = H - 2 - rows.length + 1 + dy;
      for (let dx = 0; dx < rows[dy].length; dx++) {
        const cx = o.x + dx;
        if (cx >= 0 && cx < W && row >= 0) grid[row][cx] = rows[dy][dx];
      }
    }
  }

  const cat = makeCat(catY > 0, dead);
  const baseRow = H - 3 - catY;
  for (let dy = 0; dy < cat.length; dy++) {
    const row = baseRow + dy;
    for (let dx = 0; dx < cat[dy].length; dx++) {
      const cx = PLAYER_X + dx;
      if (cx >= 0 && cx < W && row >= 0 && row < H) grid[row][cx] = cat[dy][dx];
    }
  }

  return grid.map((r) => r.join("")).join("\n");
}

export default function CatRun() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const [best, setBest] = useState(0);
  const [score, setScore] = useState(0);
  const [catY, setCatY] = useState(0);
  const [vel, setVel] = useState(0);
  const [obs, setObs] = useState([]);
  const [alive, setAlive] = useState(true);
  const [running, setRunning] = useState(false);
  const stateRef = useRef({ catY: 0, vel: 0, obs: [], score: 0, alive: true });
  const cooldownRef = useRef(20);

  useEffect(() => {
    AsyncStorage.getItem(BEST_KEY).then((v) =>
      setBest(parseInt(v || "0", 10) || 0),
    );
  }, []);

  useEffect(() => {
    if (best >= 50 && !(state.flags && state.flags.catrunBest50)) {
      dispatch({
        type: "SET_FLAG",
        payload: { flag: "catrunBest50", value: true },
      });
    }
  }, [best, state.flags, dispatch]);

  const start = useCallback(() => {
    stateRef.current = { catY: 0, vel: 0, obs: [], score: 0, alive: true };
    cooldownRef.current = 20;
    setCatY(0);
    setVel(0);
    setObs([]);
    setScore(0);
    setAlive(true);
    setRunning(true);
    dispatch({ type: "STAT_INCREMENT", payload: { key: "catrunGames" } });
  }, [dispatch]);

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (!s.alive || s.catY > 0) return;
    s.vel = 2;
    setVel(2);
  }, []);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      const s = stateRef.current;
      if (!s.alive) return;

      s.score += 1;
      s.catY += s.vel;
      s.vel -= 0.5;
      if (s.catY <= 0) {
        s.catY = 0;
        s.vel = 0;
      }

      s.obs = s.obs
        .map((o) => ({ ...o, x: o.x - 1 }))
        .filter((o) => o.x + o.s.length > 0);

      cooldownRef.current -= 1;
      if (cooldownRef.current <= 0) {
        s.obs.push({
          x: W - 1,
          s: OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)],
        });
        cooldownRef.current = 15 + Math.floor(Math.random() * 10);
      }

      for (const o of s.obs) {
        const oLeft = o.x;
        const oRight = o.x + o.s.split("\n")[0].length - 1;
        if (s.catY < 2 && oLeft <= PLAYER_X + 6 && oRight >= PLAYER_X) {
          s.alive = false;
          setAlive(false);
          setRunning(false);
          dispatch({
            type: "STAT_INCREMENT",
            payload: { key: "catrunDeaths" },
          });
          if (s.score > best) {
            setBest(s.score);
            AsyncStorage.setItem(BEST_KEY, String(s.score)).catch(() => {});
          }
          return;
        }
      }

      setCatY(s.catY);
      setObs([...s.obs]);
      setScore(s.score);
    }, TICK);
    return () => clearInterval(iv);
  }, [running, best, dispatch]);

  const styles = useMemo(() => makeStyles(theme), [theme]);
  const display = render(catY, obs, !alive);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Emoji size={12}>{"\u{1F431}"}</Emoji>
          <Text style={styles.title}>Cat Run</Text>
        </View>
        <Text style={styles.score}>
          {"HI " +
            String(best).padStart(4, "0") +
            "   " +
            String(score).padStart(4, "0")}
        </Text>
      </View>

      <Pressable onPress={running ? jump : start} style={styles.canvasWrap}>
        <Text style={styles.canvas}>{display}</Text>
        {!running && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>
              {alive
                ? "toque para comecar"
                : "GAME OVER  .  toque para reiniciar"}
            </Text>
            {!alive && (
              <Text style={styles.overlaySub}>
                {"score: " + score + "  best: " + best}
              </Text>
            )}
          </View>
        )}
      </Pressable>

      <Text style={styles.hint}>toque na tela para pular</Text>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 4,
      marginBottom: 4,
    },
    title: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "bold",
    },
    score: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 11,
      letterSpacing: 1,
    },
    canvasWrap: {
      flex: 1,
      backgroundColor: "#000",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 4,
      position: "relative",
      overflow: "hidden",
    },
    canvas: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 8,
      lineHeight: 10,
      letterSpacing: 0,
    },
    overlay: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "#00000080",
      alignItems: "center",
      justifyContent: "center",
    },
    overlayTitle: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "bold",
    },
    overlaySub: {
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 10,
      marginTop: 6,
    },
    hint: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 9,
      textAlign: "center",
      marginTop: 6,
    },
  });
}
