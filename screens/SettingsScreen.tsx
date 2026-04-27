import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Alert, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';
import { useBackground } from '../lib/backgroundContext';
import { useTheme, COLOR_PALETTE } from '../lib/themeContext';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const DEFAULT_BG = require('../assets/PT_Background.png');

type SectionKey = 'color' | 'textSize' | 'background';

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { backgroundUri, setBackgroundUri } = useBackground();
  const { isGreyscale, accentColor, isTextLarge, setGreyscale, setAccentColor, setTextLarge } = useTheme();
  const [expanded, setExpanded] = useState<SectionKey | null>(null);

  const toggle = (key: SectionKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => prev === key ? null : key);
  };

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

  const handleSelectColor = (color: string) => {
    if (isGreyscale) setGreyscale(false);
    setAccentColor(color);
  };

  const colorPreview = isGreyscale
    ? <Text style={styles.previewLabel}>Greyscale</Text>
    : <View style={[styles.previewSwatch, { backgroundColor: accentColor }]} />;

  const textPreview = <Text style={styles.previewLabel}>{isTextLarge ? 'Large' : 'Default'}</Text>;

  const bgPreview = <Text style={styles.previewLabel}>{backgroundUri ? 'Custom' : 'Default'}</Text>;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Settings</Text>
      </GlassPanel>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>

        {/* Upgrade to Pro */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('UpgradeToPro')}>
          <GlassPanel style={styles.upgradeRow}>
            <Text style={styles.upgradeIcon}>👑</Text>
            <View style={styles.upgradeText}>
              <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
              <Text style={styles.upgradeSub}>Unlock all features</Text>
            </View>
            <Text style={styles.upgradeArrow}>›</Text>
          </GlassPanel>
        </TouchableOpacity>

        {/* Color Scale */}
        <GlassPanel style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle('color')} activeOpacity={0.8}>
            <Text style={styles.sectionTitle}>Color Scale</Text>
            <View style={styles.sectionRight}>
              {colorPreview}
              <Text style={styles.chevron}>{expanded === 'color' ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>

          {expanded === 'color' && (
            <View style={styles.sectionBody}>
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
            </View>
          )}
        </GlassPanel>

        {/* Text Size */}
        <GlassPanel style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle('textSize')} activeOpacity={0.8}>
            <Text style={styles.sectionTitle}>Text Size</Text>
            <View style={styles.sectionRight}>
              {textPreview}
              <Text style={styles.chevron}>{expanded === 'textSize' ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>

          {expanded === 'textSize' && (
            <View style={styles.sectionBody}>
              <View style={styles.segmentRow}>
                <TouchableOpacity style={[styles.segment, !isTextLarge && styles.segmentActive]} onPress={() => setTextLarge(false)} activeOpacity={0.8}>
                  <Text style={[styles.segmentSampleDefault, !isTextLarge && styles.segmentTextActive]}>Aa</Text>
                  <Text style={[styles.segmentText, !isTextLarge && styles.segmentTextActive]}>Default</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.segment, isTextLarge && styles.segmentActive]} onPress={() => setTextLarge(true)} activeOpacity={0.8}>
                  <Text style={[styles.segmentSampleLarge, isTextLarge && styles.segmentTextActive]}>Aa</Text>
                  <Text style={[styles.segmentText, isTextLarge && styles.segmentTextActive]}>Large</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </GlassPanel>

        {/* Background Image */}
        <GlassPanel style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle('background')} activeOpacity={0.8}>
            <Text style={styles.sectionTitle}>Background Image</Text>
            <View style={styles.sectionRight}>
              {bgPreview}
              <Text style={styles.chevron}>{expanded === 'background' ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>

          {expanded === 'background' && (
            <View style={styles.sectionBody}>
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
            </View>
          )}
        </GlassPanel>

        {/* Options */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Options')}>
          <GlassPanel style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Options</Text>
              <View style={styles.sectionRight}>
                <Text style={styles.previewLabel}>About, Share & Legal</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </View>
          </GlassPanel>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  header: { borderRadius: 18, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 14 },
  back: { color: C.accent, fontSize: Math.round(15 * C.textScale), marginBottom: 4 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },

  list: { gap: 10, paddingBottom: 100 },

  upgradeRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, borderColor: C.accent, borderWidth: 1.5 },
  upgradeIcon: { fontSize: Math.round(24 * C.textScale), marginRight: 12 },
  upgradeText: { flex: 1 },
  upgradeTitle: { fontSize: Math.round(16 * C.textScale), fontWeight: '700', color: C.accent },
  upgradeSub: { fontSize: Math.round(12 * C.textScale), color: C.textMuted, marginTop: 2 },
  upgradeArrow: { fontSize: Math.round(22 * C.textScale), color: C.accent },

  section: { borderRadius: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  sectionTitle: { fontSize: Math.round(13 * C.textScale), fontWeight: '700', color: C.text },
  sectionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewLabel: { fontSize: Math.round(13 * C.textScale), color: C.textMuted, fontWeight: '500' },
  previewSwatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)' },
  chevron: { fontSize: Math.round(11 * C.textScale), color: C.textMuted },

  sectionBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 14 },

  segmentRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 12, padding: 3, marginBottom: 14 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: C.accent },
  segmentText: { fontSize: Math.round(13 * C.textScale), fontWeight: '600', color: C.textMuted, marginTop: 2 },
  segmentTextActive: { color: '#fff' },
  segmentSampleDefault: { fontSize: Math.round(18 * C.textScale), fontWeight: '700', color: C.textMuted },
  segmentSampleLarge: { fontSize: Math.round(24 * C.textScale), fontWeight: '700', color: C.textMuted },

  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatchWrap: { alignItems: 'center', width: 52 },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  swatchSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.1 }] },
  swatchCheck: { color: '#fff', fontSize: Math.round(14 * C.textScale), fontWeight: '800' },
  swatchLabel: { fontSize: Math.round(10 * C.textScale), color: C.textMuted, fontWeight: '500' },

  preview: { height: 90, borderRadius: 10, overflow: 'hidden', marginBottom: 4 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  optionDisabled: { opacity: 0.4 },
  optionIcon: { fontSize: Math.round(18 * C.textScale), marginRight: 10 },
  optionText: { flex: 1 },
  optionTitle: { fontSize: Math.round(14 * C.textScale), fontWeight: '600', color: C.text },
  optionTitleMuted: { color: C.textMuted },
  optionSub: { fontSize: Math.round(12 * C.textScale), color: C.textMuted, marginTop: 1 },
  optionArrow: { fontSize: Math.round(18 * C.textScale), color: C.textMuted },
});
