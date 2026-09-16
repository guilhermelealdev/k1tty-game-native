// src/game/theme/ThemeContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import { DEFAULT_THEME_ID, getThemeById, THEMES } from "./themes";

const ThemeContext = createContext<any>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);

  const value = useMemo(() => {
    return {
      themeId,
      theme: getThemeById(themeId),
      setTheme: setThemeId,
      themes: THEMES,
    };
  }, [themeId]);

  // No web: sincroniza CSS variables no <html> pra scrollbar e selects
  // herdarem a paleta do tema atual.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof document === "undefined") return;

    const c = value.theme.colors;
    const root = document.documentElement;

    root.setAttribute("data-theme", value.themeId);
    root.style.setProperty("--k1tty-bg", c.bg);
    root.style.setProperty("--k1tty-bg-deep", c.bgDeep);
    root.style.setProperty("--k1tty-command", c.command);
    root.style.setProperty("--k1tty-border", c.border);
    root.style.setProperty("--k1tty-text", c.text);
    root.style.setProperty("--k1tty-dim", c.dim);
    root.style.setProperty("--k1tty-error", c.error);
    root.style.setProperty("--k1tty-warning", c.warning);
  }, [value.themeId]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme fora do ThemeProvider");
  return ctx;
}
