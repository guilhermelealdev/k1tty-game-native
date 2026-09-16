// src/game/components/FloatingWindow.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { tapMedium } from "../services/haptics";
import { useTheme } from "../theme/ThemeContext";

const MIN_WIDTH = 220;
const MIN_HEIGHT = 180;
const EDGE = 8;

function clampToScreen(x: number, y: number, w: number, h: number) {
  const { width: sw, height: sh } = Dimensions.get("window");
  const maxW = sw - EDGE * 2;
  const maxH = sh - EDGE * 2 - 60;
  const finalW = Math.min(w, maxW);
  const finalH = Math.min(h, maxH);
  const finalX = Math.max(EDGE, Math.min(x, sw - finalW - EDGE));
  const finalY = Math.max(EDGE, Math.min(y, sh - finalH - EDGE));
  return { x: finalX, y: finalY, width: finalW, height: finalH };
}

export default function FloatingWindow({
  id,
  title,
  position,
  onClose,
  onMove,
  onFocus,
  children,
}: any) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { width: screenW, height: screenH } = Dimensions.get("window");

  const [maximized, setMaximized] = useState<boolean>(false);

  const initial = clampToScreen(
    position.x || 20,
    position.y || 60,
    position.width || 340,
    position.height || 460,
  );

  const pan = useRef(
    new Animated.ValueXY({ x: initial.x, y: initial.y }),
  ).current;

  const size = useRef({
    width: initial.width,
    height: initial.height,
    prevW: initial.width,
    prevH: initial.height,
    prevX: initial.x,
    prevY: initial.y,
  }).current;

  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (position.x !== undefined)
      pan.setValue({ x: position.x, y: position.y });
  }, [position.x, position.y, pan]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStart.current = {
          x: (pan.x as any).__getValue(),
          y: (pan.y as any).__getValue(),
        };
        onFocus && onFocus();
      },
      onPanResponderMove: (_, g) => {
        pan.setValue({
          x: dragStart.current.x + g.dx,
          y: Math.max(EDGE, dragStart.current.y + g.dy),
        });
      },
      onPanResponderRelease: () => {
        const next = {
          x: (pan.x as any).__getValue(),
          y: (pan.y as any).__getValue(),
        };
        onMove && onMove(next);
      },
    }),
  ).current;

  const toggleMaximize = () => {
    if (!maximized) {
      size.prevW = size.width;
      size.prevH = size.height;
      size.prevX = (pan.x as any).__getValue();
      size.prevY = (pan.y as any).__getValue();
      size.width = screenW - EDGE * 2;
      size.height = screenH - EDGE * 2 - 60;
      pan.setValue({ x: EDGE, y: EDGE + 30 });
      setMaximized(true);
    } else {
      size.width = size.prevW;
      size.height = size.prevH;
      pan.setValue({ x: size.prevX, y: size.prevY });
      setMaximized(false);
    }
    onFocus && onFocus();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size.width,
          height: size.height,
          transform: pan.getTranslateTransform(),
        },
      ]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={() => onFocus && onFocus()}
    >
      <View style={styles.header} {...responder.panHandlers}>
        <Text style={styles.title} numberOfLines={1}>
          {"\u25B8 "}
          {title}
        </Text>
        <View style={styles.headerButtons}>
          <Pressable
            onPress={() => {
              tapMedium();
              toggleMaximize();
            }}
            hitSlop={12}
            android_ripple={{ color: theme.colors.command + "30" }}
            style={styles.iconBtn}
          >
            <Text style={styles.maxText}>
              {maximized ? "\u2750" : "\u25A1"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              tapMedium();
              onClose && onClose();
            }}
            hitSlop={12}
            android_ripple={{ color: theme.colors.error + "30" }}
            style={styles.iconBtn}
          >
            <Text style={styles.closeText}>{"\u2715"}</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.body}>{children}</View>
    </Animated.View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    container: {
      position: "absolute",
      top: 0,
      left: 0,
      backgroundColor: t.colors.bgPanel,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 4,
      shadowColor: t.colors.command,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
      elevation: 8,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: t.colors.bgHeader,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    title: {
      flex: 1,
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
    headerButtons: { flexDirection: "row", alignItems: "center" },
    iconBtn: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 4,
      borderRadius: 4,
    },
    maxText: { color: t.colors.command, fontSize: 16, fontWeight: "bold" },
    closeText: { color: t.colors.error, fontSize: 16, fontWeight: "bold" },
    body: { flex: 1, padding: 8, overflow: "hidden" },
  });
}
