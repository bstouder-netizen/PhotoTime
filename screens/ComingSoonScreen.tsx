import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';

export default function ComingSoonScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const title = route?.params?.title ?? 'Coming Soon';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>{title}</Text>
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

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  header: { borderRadius: 18, marginBottom: 10, paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { marginBottom: 4 },
  back: { color: C.accent, fontSize: Math.round(15 * C.textScale) },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40, borderRadius: 24, minWidth: 240 },
  emoji: { fontSize: Math.round(52 * C.textScale), marginBottom: 16 },
  comingSoon: { fontSize: Math.round(24 * C.textScale), fontWeight: '700', color: C.text, marginBottom: 8 },
  sub: { fontSize: Math.round(15 * C.textScale), color: C.textSub },
});
