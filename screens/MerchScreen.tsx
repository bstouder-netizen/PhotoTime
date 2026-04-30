import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';

const IMG_W = 864;
const IMG_H = 1821;

export default function MerchScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { width: screenWidth } = useWindowDimensions();
  const imgWidth = screenWidth - 32;
  const imgHeight = imgWidth * (IMG_H / IMG_W);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Merch</Text>
      </GlassPanel>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Image
          source={require('../assets/PT_Merch_Coming_Soon.png')}
          style={{ width: imgWidth, height: imgHeight, borderRadius: 22 }}
          resizeMode="contain"
        />
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  header: { borderRadius: 18, marginBottom: 10, paddingHorizontal: 16, paddingVertical: 8 },
  back: { color: C.accent, fontSize: Math.round(15 * C.textScale), marginBottom: 4 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },
  content: { paddingBottom: 100 },
});
