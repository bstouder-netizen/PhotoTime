import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';
import { useBackground } from '../lib/backgroundContext';

const DEFAULT_BG = require('../assets/PT_Background.png');

export default function BackgroundImageScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { backgroundUri, setBackgroundUri } = useBackground();

  const pickBackground = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.9 }, response => {
      if (response.didCancel || response.errorCode) return;
      const uri = response.assets?.[0]?.uri;
      if (uri) setBackgroundUri(uri);
    });
  };

  const resetDefault = () => {
    Alert.alert('Use Default Background', 'Reset to the original background image?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', onPress: () => setBackgroundUri(null) },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Background Image</Text>
      </GlassPanel>

      <GlassPanel style={styles.card}>
        <ImageBackground
          source={backgroundUri ? { uri: backgroundUri } : DEFAULT_BG}
          style={styles.preview}
          imageStyle={{ borderRadius: 10, resizeMode: 'cover' }}
        />
        <TouchableOpacity style={styles.optionRow} onPress={pickBackground} activeOpacity={0.8}>
          <Text style={styles.optionIcon}>🖼️</Text>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Choose from Library</Text>
            <Text style={styles.optionSub}>Pick a photo from your album</Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionRow, !backgroundUri && styles.optionDisabled]}
          onPress={resetDefault}
          activeOpacity={backgroundUri ? 0.8 : 1}
          disabled={!backgroundUri}
        >
          <Text style={styles.optionIcon}>↩️</Text>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, !backgroundUri && styles.optionTitleMuted]}>Use Default</Text>
            <Text style={styles.optionSub}>Restore the original background</Text>
          </View>
        </TouchableOpacity>
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
  preview: { height: 160, borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border },
  optionDisabled: { opacity: 0.4 },
  optionIcon: { fontSize: Math.round(18 * C.textScale), marginRight: 12 },
  optionText: { flex: 1 },
  optionTitle: { fontSize: Math.round(14 * C.textScale), fontWeight: '600', color: C.text },
  optionTitleMuted: { color: C.textMuted },
  optionSub: { fontSize: Math.round(12 * C.textScale), color: C.textMuted, marginTop: 1 },
  optionArrow: { fontSize: Math.round(18 * C.textScale), color: C.textMuted },
});
