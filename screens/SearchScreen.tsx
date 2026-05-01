import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';

export default function SearchScreen(_: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const rows: { icon: any; onPress: () => void }[][] = [];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <Text style={styles.heading}>Jobs & Gigs</Text>
        <Text style={styles.subheading}>Find work and opportunities</Text>
      </GlassPanel>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {rows.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((item, j) => (
              <TouchableOpacity key={j} activeOpacity={0.88} style={styles.card} onPress={item.onPress}>
                <Image source={item.icon} style={styles.cardImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  header: { borderRadius: 18, marginBottom: 10, paddingHorizontal: 16, paddingVertical: 8 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },
  subheading: { fontSize: Math.round(13 * C.textScale), color: C.textMuted, marginTop: 2 },

  list: { gap: 10, paddingBottom: 100 },
  row: { flexDirection: 'row', gap: 10 },
  card: {
    flex: 1, height: 110, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10,
  },
  cardImage: { width: '100%', height: '100%', transform: [{ scale: 1.55 }] },
});
