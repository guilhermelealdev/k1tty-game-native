// src/game/components/MatrixBackground.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

const CHARS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF";

const FONT_SIZE = 14;
const LINE_HEIGHT = 17;
const CHAR_WIDTH = 9;
const TICK = 180;

const GridText = React.memo(function GridText({
  grid,
  color,
}: {
  grid: string;
  color: string;
}) {
  return (
    <Text
      style={[styles.grid, { color }]}
      allowFontScaling={false}
      renderToHardwareTextureAndroid={true}
      shouldRasterizeIOS={true}
    >
      {grid}
    </Text>
  );
});

function MatrixBackgroundComponent({ enabled = true }: { enabled?: boolean }) {
  const { width, height } = useWindowDimensions();
  const [grid, setGrid] = useState("");
  const dropsRef = useRef<{ y: number; speed: number }[]>([]);

  const cols = useMemo(() => Math.ceil((width * 1.15) / CHAR_WIDTH), [width]);
  const rows = useMemo(
    () => Math.ceil((height * 1.15) / LINE_HEIGHT),
    [height],
  );

  useEffect(() => {
    const arr: { y: number; speed: number }[] = [];
    for (let i = 0; i < cols; i++) {
      arr.push({
        y: Math.random() * rows,
        speed: 0.4 + Math.random() * 0.7,
      });
    }
    dropsRef.current = arr;
  }, [cols, rows]);

  useEffect(() => {
    if (!enabled) return;
    if (dropsRef.current.length === 0) return;

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const drops = dropsRef.current;
      const lines: string[] = [];

      for (let r = 0; r < rows; r++) {
        const rowChars: string[] = [];
        for (let c = 0; c < cols; c++) {
          const drop = drops[c];
          const head = Math.floor(drop.y);
          if (r === head) {
            rowChars.push(CHARS[(Math.random() * CHARS.length) | 0]);
          } else if (r < head && r >= head - 6) {
            rowChars.push(CHARS[(Math.random() * CHARS.length) | 0]);
          } else {
            rowChars.push(" ");
          }
        }
        lines.push(rowChars.join(""));
      }
      setGrid(lines.join("\n"));

      for (let c = 0; c < cols; c++) {
        const d = drops[c];
        d.y += d.speed;
        if (d.y > rows + 2) d.y = -Math.random() * 5;
      }
    };

    tick();
    const iv = setInterval(tick, TICK);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [cols, rows, enabled]);

  return (
    <View style={styles.wrap} pointerEvents="none">
      <GridText grid={grid} color="#95C623" />
    </View>
  );
}

const MatrixBackground = React.memo(MatrixBackgroundComponent);

export default MatrixBackground;

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#001519",
    overflow: "hidden",
  },
  grid: {
    position: "absolute",
    top: 0,
    left: 0,
    fontFamily: "monospace",
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    opacity: 0.65,
    letterSpacing: 0,
  },
});
