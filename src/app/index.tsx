// src/app/index.tsx
import { useEffect, useState } from "react";
import KernelPanicScreen from "../game/components/KernelPanicScreen";
import PreloadScreen from "../game/components/PreloadScreen";
import SaveSelectScreen from "../game/screens/SaveSelectScreen";
import TerminalScreen from "../game/screens/TerminalScreen";
import { useGame } from "../game/state/GameContext";
import { useTheme } from "../game/theme/ThemeContext";
import FinaleOverlay from "../game/viewers/FinaleOverlay";
import MiauFinaleOverlay from "../game/viewers/MiauFinaleOverlay";
import OSSwitchOverlay from "../game/viewers/OSSwitchOverlay";

export default function Index() {
  const { state } = useGame();
  const { setTheme } = useTheme();
  const [preloadDone, setPreloadDone] = useState(false);

  useEffect(() => {
    if (state.theme) setTheme(state.theme);
  }, [state.theme, setTheme]);

  // Preload só aparece no boot inicial
  if (!preloadDone) {
    return <PreloadScreen onComplete={() => setPreloadDone(true)} />;
  }

  if (state.systemCorrupted) return <KernelPanicScreen />;
  if (state.osSwitchActive) return <OSSwitchOverlay />;
  if (state.miauFinaleActive) return <MiauFinaleOverlay />;
  if (state.finaleActive) return <FinaleOverlay />;
  if (state.currentSave === null) return <SaveSelectScreen />;
  return <TerminalScreen />;
}
