"use client"

import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({
  isDarkMode: null,
  toggleDarkMode: () => {},
});

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(null);

  // Initialize theme on mount
  useEffect(() => {
    const getInitialTheme = () => {
      if (localStorage.theme === "dark" || 
          (!("theme" in localStorage) && 
           window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        return true;
      }
      return false;
    };
    
    setIsDarkMode(getInitialTheme());
  }, []);

  // Update theme when isDarkMode changes
  useEffect(() => {
    if (isDarkMode === null) return;
    
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Updated DarkModeToggle component
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Don't render until theme is determined
  if (isDarkMode === null) {
    return null;
  }

  return (
    <Button
      onClick={toggleDarkMode}
      className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      aria-label="Toggle Dark Mode"
      variant="ghost"
    >
      {isDarkMode ? (
        <Sun className="w-6 h-6 text-primary-background" />
      ) : (
        <Moon className="w-6 h-6 text-gray-500" />
      )}
    </Button>
  );
}