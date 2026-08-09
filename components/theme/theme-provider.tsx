"use client";

import { useEffect } from "react";
import { loadTheme, saveTheme, type AppTheme } from "@/lib/settings-ui";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const theme = loadTheme();
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  return <>{children}</>;
}

export function useThemeToggle() {
  return {
    getTheme: (): AppTheme => loadTheme(),
    setTheme: (theme: AppTheme) => saveTheme(theme),
  };
}
