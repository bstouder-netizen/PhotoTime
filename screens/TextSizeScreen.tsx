import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';
import { useTheme, TextSize } from '../lib/themeContext';

export default function TextSizeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { textSize, setTextSize } = useTheme();

  const options: { key: TextSize; label: string; sample: string }[] = [
    { key: 'small',   label: 'Small',   sample: 'Aa' },
    { key: 'default', label: 'Default', sample: 'Aa' },
    { key: 'large',   label: 'Large',   sample: 'Aa' },
  ];

  const scales: Record<TextSize, number> = { small: 0.85, default: 1, large: 1.2 };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Text Size</Text>
      </GlassPanel>

      <GlassPanel style={styles.card}>
        <View style={styles.segmentRow}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.segment, textSize === opt.key && styles.segmentActive]}
              onPress={() => setTextSize(opt.key)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.segmentSample,
                { fontSize: Math.round(18 * scales[opt.key]) },
                textSize === opt.key && styles.segmentTextActive,
              ]}>
                {opt.sample}
              </Text>
              <Text style={[styles.segmentLabel, textSize === opt.key && styles.segmentTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassPanel>
    </View>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  header: { borderRadius: 18, marginBottom: 10, paddingHorizontal: 16, paddingVertical: 8 },
  back: { color: C.accent, fontSize: Math.round(15 * C.textScale), marginBottom: 4 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },

  card: { borderRadius: 18, padding: 16 },
  segmentRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 12, padding: 3 },
  segment: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: C.accent },
  segmentSample: { fontWeight: '700', color: C.textMuted },
  segmentLabel: { fontSize: Math.round(12 * C.textScale), fontWeight: '600', color: C.textMuted, marginTop: 4 },
  segmentTextActive: { color: '#fff' },
});
