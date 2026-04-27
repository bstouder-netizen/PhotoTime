import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_GREYSCALE = '@theme_greyscale';
const KEY_ACCENT = '@theme_accent';
const KEY_TEXT_LARGE = '@theme_text_large';

export const GREYSCALE_ACCENT = '#3A3A3C';
export const DEFAULT_COLOR_ACCENT = '#2563EB';

export const COLOR_PALETTE = [
  { label: 'Ocean',  color: '#2563EB' },
  { label: 'Teal',   color: '#0891B2' },
  { label: 'Forest', color: '#16A34A' },
  { label: 'Sunset', color: '#EA580C' },
  { label: 'Rose',   color: '#DC2626' },
  { label: 'Berry',  color: '#DB2777' },
  { label: 'Violet', color: '#7C3AED' },
  { label: 'Gold',   color: '#B45309' },
];

type ThemeContextType = {
  isGreyscale: boolean;
  accentColor: string;
  isTextLarge: boolean;
  setGreyscale: (v: boolean) => Promise<void>;
  setAccentColor: (color: string) => Promise<void>;
  setTextLarge: (v: boolean) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
  isGreyscale: true,
  accentColor: GREYSCALE_ACCENT,
  isTextLarge: false,
  setGreyscale: async () => {},
  setAccentColor: async () => {},
  setTextLarge: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isGreyscale, setIsGreyscale] = useState(true);
  const [accentColor, setAccent] = useState(GREYSCALE_ACCENT);
  const [isTextLarge, setIsTextLarge] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(KEY_GREYSCALE),
      AsyncStorage.getItem(KEY_ACCENT),
      AsyncStorage.getItem(KEY_TEXT_LARGE),
    ]).then(([gs, ac, tl]) => {
      const grey = gs !== 'false';
      setIsGreyscale(grey);
      setAccent(grey ? GREYSCALE_ACCENT : (ac ?? DEFAULT_COLOR_ACCENT));
      setIsTextLarge(tl === 'true');
    });
  }, []);

  const setGreyscale = async (v: boolean) => {
    setIsGreyscale(v);
    await AsyncStorage.setItem(KEY_GREYSCALE, String(v));
    if (v) {
      setAccent(GREYSCALE_ACCENT);
    } else {
      const saved = await AsyncStorage.getItem(KEY_ACCENT);
      setAccent(saved ?? DEFAULT_COLOR_ACCENT);
    }
  };

  const setAccentColor = async (color: string) => {
    setAccent(color);
    await AsyncStorage.setItem(KEY_ACCENT, color);
  };

  const setTextLarge = async (v: boolean) => {
    setIsTextLarge(v);
    await AsyncStorage.setItem(KEY_TEXT_LARGE, String(v));
  };

  return (
    <ThemeContext.Provider value={{ isGreyscale, accentColor, isTextLarge, setGreyscale, setAccentColor, setTextLarge }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
