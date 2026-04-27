import React from 'react';
import { View, StyleSheet, ViewStyle, ImageBackground } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useBackground } from '../lib/backgroundContext';
import { useTheme } from '../lib/themeContext';

export const GLASS = {
  bg: 'rgba(255,255,255,0.52)',
  border: 'rgba(0,0,0,0.08)',
  highlight: 'rgba(255,255,255,0.7)',
  text: '#1C1C1E',
  textSub: '#3A3A3C',
  textMuted: '#8E8E93',
  accent: '#3A3A3C',
  accentSubtle: 'rgba(0,0,0,0.04)',
  textScale: 1,
};

export type GlassColors = typeof GLASS;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function useColors(): GlassColors {
  const { isGreyscale, accentColor, isTextLarge } = useTheme();
  const accent = isGreyscale ? GLASS.accent : accentColor;
  const accentSubtle = isGreyscale ? GLASS.accentSubtle : hexToRgba(accentColor, 0.08);
  const textScale = isTextLarge ? 1.2 : 1;
  return { ...GLASS, accent, accentSubtle, textScale };
}

const DEFAULT_BG = require('../assets/PT_Background.png');

export function GlassBg({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { backgroundUri } = useBackground();
  const { isGreyscale, accentColor } = useTheme();
  return (
    <ImageBackground
      source={backgroundUri ? { uri: backgroundUri } : DEFAULT_BG}
      style={[{ flex: 1 }, style]}
      imageStyle={{ resizeMode: 'cover' }}
    >
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(240,240,245,0.35)' }} />
      {!isGreyscale && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: hexToRgba(accentColor, 0.10) }} />
      )}
      {children}
    </ImageBackground>
  );
}

export function GlassPanel({
  children,
  style,
  blurAmount = 18,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  blurAmount?: number;
}) {
  const { isGreyscale, accentColor } = useTheme();
  return (
    <View style={[styles.panel, style]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="light"
        blurAmount={blurAmount}
        reducedTransparencyFallbackColor="rgba(235,235,235,0.85)"
      />
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
      {!isGreyscale && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: hexToRgba(accentColor, 0.06) }]} />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GLASS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  tint: {
    backgroundColor: GLASS.bg,
  },
});
