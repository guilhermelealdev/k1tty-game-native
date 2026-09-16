// src/app/_layout.tsx
import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GameProvider } from "../game/state/GameContext";
import { ThemeProvider } from "../game/theme/ThemeContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <GameProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#001519" },
              animation: "fade",
            }}
          />
        </GameProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
