import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const rows: { icon: any; onPress: () => void }[][] = [
    [
      { icon: require('../assets/PT_Color_Scale_Icon.png'),      onPress: () => navigation.navigate('ColorScale') },
      { icon: require('../assets/PT_Text_Size_Icon.png'),        onPress: () => navigation.navigate('TextSize') },
      { icon: require('../assets/PT_Background_Image_Icon.png'), onPress: () => navigation.navigate('BackgroundImage') },
    ],
    [
      { icon: require('../assets/PT_Share_App_Icon.png'),        onPress: () => Share.share({ message: 'Check out PhotoTime – the app for photographers! https://phototimeapp.com' }) },
      { icon: require('../assets/PT_Legal_Icon.png'),            onPress: () => navigation.navigate('ComingSoon', { title: 'Legal' }) },
      { icon: require('../assets/PT_About_Icon.png'),            onPress: () => navigation.navigate('About') },
    ],
    [
      { icon: require('../assets/PT_Upgrade_to_Pro_Icon.png'),   onPress: () => navigation.navigate('UpgradeToPro') },
    ],
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Settings</Text>
      </GlassPanel>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>

        {/* 3-column grid rows */}
        {rows.map((pair, i) => (
          <View key={i} style={styles.row}>
            {pair.map((item, j) => (
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
  back: { color: C.accent, fontSize: Math.round(15 * C.textScale), marginBottom: 4 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },

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
