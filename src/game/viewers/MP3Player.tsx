// src/game/viewers/MP3Player.tsx
import { Audio } from "expo-av";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Emoji from "../components/Emoji";
import { getNodeByPath } from "../fs/helpers";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";

const ASSETS_READY = false;

const MUSIC_MAP = {};
if (ASSETS_READY) {
  MUSIC_MAP[
    "Back 2 Back.mp3"
  ] = require("../../../assets/music/Back 2 Back.mp3");
  MUSIC_MAP[
    "Children of the City.mp3"
  ] = require("../../../assets/music/Children of the City.mp3");
  MUSIC_MAP["RUNAWAY.mp3"] = require("../../../assets/music/RUNAWAY.mp3");
  MUSIC_MAP[
    "You_re A Big Girl Now.mp3"
  ] = require("../../../assets/music/You_re A Big Girl Now.mp3");
}

function displayName(f) {
  return f
    .replace(/\.mp3$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function MP3Player() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const [current, setCurrent] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const soundRef = useRef(null);

  const musicNode = getNodeByPath(state.filesystem, "/home/k1tty/Music");
  const tracks =
    musicNode && musicNode.children
      ? Object.values(musicNode.children).filter(
          (f) => f.type === "file" && /\.mp3$/i.test(f.name),
        )
      : [];

  useEffect(() => {
    if (tracks.length > 0 && !current) setCurrent(tracks[0]);
  }, [tracks, current]);

  useEffect(() => {
    if (current && playing) {
      dispatch({
        type: "STAT_PUSH",
        payload: { key: "tracksPlayed", value: current.name },
      });
    }
  }, [current, playing, dispatch]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        try {
          soundRef.current.unloadAsync();
        } catch {}
      }
    };
  }, []);

  const loadTrack = async (track, autoplay) => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setProgress(0);
    setDuration(0);

    const src = MUSIC_MAP[track.name];
    if (!src) {
      if (autoplay) setPlaying(true);
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(src, {
        shouldPlay: autoplay,
        volume: 0.4,
      });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((st) => {
        if (!st.isLoaded) return;
        if (st.durationMillis) setDuration(st.durationMillis / 1000);
        if (st.positionMillis)
          setProgress((st.positionMillis / st.durationMillis) * 100);
        if (st.didJustFinish) {
          setPlaying(false);
          setProgress(0);
        }
      });
      setPlaying(autoplay);
    } catch (e) {
      if (autoplay) setPlaying(true);
    }
  };

  const toggle = async () => {
    if (soundRef.current) {
      if (playing) {
        try {
          await soundRef.current.pauseAsync();
        } catch {}
        setPlaying(false);
      } else {
        try {
          await soundRef.current.playAsync();
        } catch {}
        setPlaying(true);
      }
    } else {
      setPlaying((p) => !p);
    }
  };

  const stop = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
      } catch {}
    }
    setPlaying(false);
    setProgress(0);
  };

  const pick = (track) => {
    setCurrent(track);
    loadTrack(track, true);
  };

  const fmt = (secs) => {
    if (!isFinite(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m + ":" + String(s).padStart(2, "0");
  };

  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (tracks.length === 0) {
    return (
      <View style={styles.empty}>
        <Emoji size={48}>{"\u{1F3B5}"}</Emoji>
        <Text style={styles.emptyText}>Nenhuma musica instalada.</Text>
        <Text style={styles.emptyHint}>Transfira via Bluetooth primeiro.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {current && (
        <View style={styles.playerBox}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Emoji size={20}>{playing ? "\u{1F3B5}" : "\u23F8"}</Emoji>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {current.meta?.title || displayName(current.name)}
            </Text>
          </View>
          <Text style={styles.trackInfo}>
            {playing
              ? "tocando... " +
                fmt((progress / 100) * duration) +
                " / " +
                fmt(duration)
              : "pausado"}
          </Text>

          <View style={styles.progressWrap}>
            <View style={[styles.progressFill, { width: progress + "%" }]} />
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <Pressable onPress={toggle} style={styles.btn}>
              <Text style={styles.btnText}>{playing ? "pausar" : "tocar"}</Text>
            </Pressable>
            <Pressable onPress={stop} style={styles.btn}>
              <Text style={styles.btnText}>parar</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text style={styles.listHeader}>{"FAIXAS (" + tracks.length + ")"}</Text>
      <ScrollView style={{ flex: 1 }}>
        {tracks.map((t) => {
          const on = current && current.name === t.name;
          return (
            <Pressable
              key={t.name}
              onPress={() => pick(t)}
              style={[styles.item, on && styles.itemActive]}
            >
              <Emoji size={14}>
                {on && playing ? "\u{1F3B5}" : "\u{1F3B6}"}
              </Emoji>
              <Text
                style={[styles.itemName, on && { color: theme.colors.command }]}
                numberOfLines={1}
              >
                {t.meta?.title || displayName(t.name)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!ASSETS_READY && (
        <Text style={styles.note}>
          {"modo visual - copie assets/music/ e mude ASSETS_READY"}
        </Text>
      )}
    </View>
  );
}

function makeStyles(t) {
  return StyleSheet.create({
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: 20,
    },
    emptyText: {
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 12,
    },
    emptyHint: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 10,
      fontStyle: "italic",
    },
    playerBox: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 4,
      padding: 12,
      marginBottom: 10,
      backgroundColor: t.colors.bgDeep,
    },
    trackTitle: {
      flex: 1,
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "bold",
    },
    trackInfo: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 9,
      marginTop: 2,
    },
    progressWrap: {
      height: 4,
      backgroundColor: t.colors.bgPanel,
      borderRadius: 2,
      marginTop: 10,
      overflow: "hidden",
    },
    progressFill: { height: "100%", backgroundColor: t.colors.command },
    btn: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 3,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    btnText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 10,
    },
    listHeader: {
      color: t.colors.border,
      fontFamily: "monospace",
      fontSize: 9,
      letterSpacing: 1,
      marginBottom: 4,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 3,
      marginBottom: 3,
      borderWidth: 1,
      borderColor: "transparent",
    },
    itemActive: {
      backgroundColor: t.colors.command + "20",
      borderColor: t.colors.command + "60",
    },
    itemName: {
      flex: 1,
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 10,
    },
    note: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 8,
      textAlign: "center",
      marginTop: 6,
      fontStyle: "italic",
    },
  });
}
