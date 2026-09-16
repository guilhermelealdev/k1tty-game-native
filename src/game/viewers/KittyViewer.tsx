// src/game/viewers/KittyViewer.tsx
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Emoji from "../components/Emoji";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";

const API = "https://api.thecatapi.com/v1/images/search?limit=1&order=RANDOM";

export default function KittyViewer() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    const cache = state.apiCache && state.apiCache.catImage;
    if (cache) {
      setUrl(cache);
      setLoading(false);
      dispatch({
        type: "STAT_PUSH",
        payload: { key: "catPhotosSeen", value: cache },
      });
      return;
    }
    try {
      const r = await fetch(API + "&_=" + Date.now());
      const data = await r.json();
      if (data && data[0] && data[0].url) {
        setUrl(data[0].url);
        dispatch({
          type: "STAT_PUSH",
          payload: { key: "catPhotosSeen", value: data[0].url },
        });
      } else {
        setError(true);
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.imageWrap}>
        {loading && <ActivityIndicator color={theme.colors.command} />}
        {!loading && error && (
          <View style={{ alignItems: "center", gap: 10 }}>
            <Emoji size={64}>{"\u{1F431}"}</Emoji>
            <Text style={styles.error}>
              {"nao foi possivel buscar uma foto"}
            </Text>
          </View>
        )}
        {!loading && !error && url && (
          <Image
            source={{ uri: url }}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>

      <View style={styles.footer}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Emoji size={12}>{"\u{1F431}"}</Emoji>
          <Text style={styles.hint}>{"cat api . foto aleatoria"}</Text>
        </View>
        <Pressable onPress={load} disabled={loading} style={styles.btn}>
          <Text style={styles.btnText}>{loading ? "..." : "outro gato"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    imageWrap: {
      flex: 1,
      backgroundColor: t.colors.bgDeep,
      borderRadius: 4,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 180,
      overflow: "hidden",
    },
    image: { width: "100%", height: "100%" },
    error: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 11,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
    },
    hint: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 9,
    },
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
  });
}
