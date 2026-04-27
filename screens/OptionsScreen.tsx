import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';

export default function OptionsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const rows = [
    {
      icon: 'ℹ️',
      title: 'About',
      sub: 'Learn more about PhotoTime',
      onPress: () => navigation.navigate('ComingSoon', { title: 'About' }),
    },
    {
      icon: '↗️',
      title: 'Share App',
      sub: 'Tell your photographer friends',
      onPress: () => Share.share({ message: 'Check out PhotoTime – the app for photographers! https://phototimeapp.com' }),
    },
    {
      icon: '⚖️',
      title: 'Legal',
      sub: 'Terms of service & privacy policy',
      onPress: () => navigation.navigate('ComingSoon', { title: 'Legal' }),
    },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headingRow}>
          <Image source={require('../assets/PT_Options_Icon.png')} style={styles.headerIcon} resizeMode="contain" />
          <Text style={styles.heading}>Options</Text>
        </View>
      </GlassPanel>

      <View style={styles.list}>
        {rows.map(row => (
          <TouchableOpacity key={row.title} onPress={row.onPress} activeOpacity={0.85}>
            <GlassPanel style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowIcon}>{row.icon}</Text>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{row.title}</Text>
                  <Text style={styles.rowSub}>{row.sub}</Text>
                </View>
                <Text style={styles.rowArrow}>›</Text>
              </View>
            </GlassPanel>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  header: { borderRadius: 18, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 14 },
  back: { color: C.accent, fontSize: Math.round(15 * C.textScale), marginBottom: 4 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: Math.round(32 * C.textScale), height: Math.round(32 * C.textScale) },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },

  list: { gap: 10 },
  card: { borderRadius: 18 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  rowIcon: { fontSize: Math.round(22 * C.textScale), marginRight: 14 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: Math.round(16 * C.textScale), fontWeight: '600', color: C.text },
  rowSub: { fontSize: Math.round(12 * C.textScale), color: C.textMuted, marginTop: 2 },
  rowArrow: { fontSize: Math.round(22 * C.textScale), color: C.textMuted },
});
