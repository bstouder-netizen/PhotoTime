import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassPanel, GLASS } from '../components/Glass';

export default function SearchScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <Text style={styles.heading}>Photography Stuff</Text>
        <Text style={styles.subheading}>Gear, accessories & more</Text>
      </GlassPanel>

      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.card}
          onPress={() => navigation.navigate && navigation.navigate('ComingSoon', { title: 'Store' })}
        >
          <Image source={require('../assets/PT_Store_Icon.png')} style={styles.cardImage} resizeMode="cover" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.card}
          onPress={() => navigation.navigate && navigation.navigate('ComingSoon', { title: 'Merch' })}
        >
          <Image source={require('../assets/PT_Merch_Icon.png')} style={styles.cardImage} resizeMode="cover" />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.cardSm}
          onPress={() => navigation.navigate && navigation.navigate('ComingSoon', { title: 'Photographer Search' })}
        >
          <Image source={require('../assets/PT_Photographer_Search_Icon.png')} style={styles.cardImageSm} resizeMode="cover" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.cardSm}
          onPress={() => navigation.navigate && navigation.navigate('ComingSoon', { title: 'Settings' })}
        >
          <Image source={require('../assets/PT_Settings_Icon.png')} style={styles.cardImageSm} resizeMode="cover" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.cardSm}
          onPress={() => navigation.navigate && navigation.navigate('ComingSoon', { title: 'About' })}
        >
          <Image source={require('../assets/PT_About_Icon.png')} style={styles.cardImageSm} resizeMode="cover" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  header: { borderRadius: 18, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 14 },
  heading: { fontSize: 22, fontWeight: '700', color: GLASS.text },
  subheading: { fontSize: 13, color: GLASS.textMuted, marginTop: 2 },

  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  wideCard: {
    height: 180, borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: GLASS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16,
  },
  card: {
    flex: 1, height: 200, borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: GLASS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16,
  },
  cardImage: { width: '100%', height: '100%', transform: [{ scale: 1.55 }] },
  cardSm: {
    flex: 1, height: 200, borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: GLASS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16,
  },
  cardImageSm: { width: '100%', height: '100%', transform: [{ scale: 1.15 }] },
});
