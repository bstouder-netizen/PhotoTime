import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassPanel, GLASS } from '../components/Glass';

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <Text style={styles.heading}>Portfolio</Text>
      </GlassPanel>
      <View style={styles.body}>
        <GlassPanel style={styles.card}>
          <Text style={styles.emoji}>🚧</Text>
          <Text style={styles.comingSoon}>Coming Soon</Text>
          <Text style={styles.sub}>This feature is on its way.</Text>
        </GlassPanel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  header: { borderRadius: 18, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 14 },
  heading: { fontSize: 22, fontWeight: '700', color: GLASS.text },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40, borderRadius: 24, minWidth: 240 },
  emoji: { fontSize: 52, marginBottom: 16 },
  comingSoon: { fontSize: 24, fontWeight: '700', color: GLASS.text, marginBottom: 8 },
  sub: { fontSize: 15, color: GLASS.textSub },
});
