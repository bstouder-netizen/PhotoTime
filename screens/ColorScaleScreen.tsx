import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';
import { useTheme, COLOR_PALETTE } from '../lib/themeContext';

export default function ColorScaleScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { isGreyscale, accentColor, setGreyscale, setAccentColor } = useTheme();

  const handleSelectColor = (color: string) => {
    if (isGreyscale) setGreyscale(false);
    setAccentColor(color);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Color Scale</Text>
      </GlassPanel>

      <GlassPanel style={styles.card}>
        <View style={styles.segmentRow}>
          <TouchableOpacity style={[styles.segment, isGreyscale && styles.segmentActive]} onPress={() => setGreyscale(true)} activeOpacity={0.8}>
            <Text style={[styles.segmentText, isGreyscale && styles.segmentTextActive]}>Greyscale</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segment, !isGreyscale && styles.segmentActive]} onPress={() => { if (isGreyscale) setGreyscale(false); }} activeOpacity={0.8}>
            <Text style={[styles.segmentText, !isGreyscale && styles.segmentTextActive]}>Color</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.palette}>
          {COLOR_PALETTE.map(({ label, color }) => {
            const selected = !isGreyscale && accentColor === color;
            return (
              <TouchableOpacity key={color} onPress={() => handleSelectColor(color)} activeOpacity={0.8} style={styles.swatchWrap}>
                <View style={[styles.swatch, { backgroundColor: color }, selected && styles.swatchSelected]}>
                  {selected && <Text style={styles.swatchCheck}>✓</Text>}
                </View>
                <Text style={styles.swatchLabel}>{label}</Text>
              </TouchableOpacity>
            );
          })}
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
  segmentRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 12, padding: 3, marginBottom: 20 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: C.accent },
  segmentText: { fontSize: Math.round(13 * C.textScale), fontWeight: '600', color: C.textMuted },
  segmentTextActive: { color: '#fff' },

  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatchWrap: { alignItems: 'center', width: 52 },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  swatchSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.1 }] },
  swatchCheck: { color: '#fff', fontSize: Math.round(14 * C.textScale), fontWeight: '800' },
  swatchLabel: { fontSize: Math.round(10 * C.textScale), color: C.textMuted, fontWeight: '500' },
});
