import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';

const FEATURES = [
  { icon: '📸', title: 'Unlimited Shoots', sub: 'Post and browse unlimited job listings' },
  { icon: '🗺️', title: 'Scout Locations', sub: 'Access the full scouted locations map' },
  { icon: '🌅', title: 'Sun Calculator', sub: 'Plan shoots with golden hour precision' },
  { icon: '🏅', title: 'Portfolio Showcase', sub: 'Share your portfolio with the community' },
  { icon: '🤝', title: 'Job Referrals', sub: 'Send and receive photographer referrals' },
  { icon: '🔍', title: 'Photographer Search', sub: 'Find photographers near you' },
  { icon: '🛍️', title: 'Store & Merch', sub: 'Access gear deals and exclusive merch' },
];

export default function UpgradeToProScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const handleUpgrade = () => {
    Alert.alert(
      'Coming Soon',
      'In-app purchases will be available in the next update.',
      [{ text: 'OK' }],
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Upgrade to Pro</Text>
      </GlassPanel>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <GlassPanel style={styles.heroCard}>
          <Text style={styles.crownIcon}>👑</Text>
          <Text style={styles.heroTitle}>PhotoTime Pro</Text>
          <Text style={styles.heroSub}>Unlock the full experience for photographers</Text>
        </GlassPanel>

        <GlassPanel style={styles.featuresCard}>
          <Text style={styles.featuresLabel}>What's included</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i === 0 && styles.featureRowFirst]}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          ))}
        </GlassPanel>

        <GlassPanel style={styles.pricingCard}>
          <Text style={styles.pricingLabel}>Simple pricing</Text>
          <View style={styles.pricingRow}>
            <View style={[styles.pricingOption, styles.pricingOptionHighlight]}>
              <Text style={styles.pricingBadge}>BEST VALUE</Text>
              <Text style={styles.pricingAmount}>$29.99</Text>
              <Text style={styles.pricingPeriod}>per year</Text>
              <Text style={styles.pricingSavings}>Save 50%</Text>
            </View>
            <View style={styles.pricingOption}>
              <Text style={styles.pricingAmountAlt}>$4.99</Text>
              <Text style={styles.pricingPeriodAlt}>per month</Text>
            </View>
          </View>
        </GlassPanel>

        <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade} activeOpacity={0.85}>
          <Text style={styles.upgradeBtnText}>👑  Get Pro</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.laterText}>Maybe Later</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          Subscriptions auto-renew unless cancelled. Cancel anytime in your App Store settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  header: { borderRadius: 18, marginBottom: 10, paddingHorizontal: 16, paddingVertical: 8 },
  back: { color: C.accent, fontSize: Math.round(15 * C.textScale), marginBottom: 4 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },

  content: { gap: 12 },

  heroCard: { borderRadius: 22, alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  crownIcon: { fontSize: Math.round(56 * C.textScale), marginBottom: 10 },
  heroTitle: { fontSize: Math.round(26 * C.textScale), fontWeight: '800', color: C.text, marginBottom: 6 },
  heroSub: { fontSize: Math.round(14 * C.textScale), color: C.textSub, textAlign: 'center', lineHeight: 20 },

  featuresCard: { borderRadius: 20, padding: 16 },
  featuresLabel: { fontSize: Math.round(11 * C.textScale), fontWeight: '700', letterSpacing: 1.2, color: C.accent, textTransform: 'uppercase', marginBottom: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderTopWidth: 1, borderTopColor: C.border },
  featureRowFirst: { borderTopWidth: 0 },
  featureIcon: { fontSize: Math.round(20 * C.textScale), width: 32, textAlign: 'center', marginRight: 12 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: Math.round(14 * C.textScale), fontWeight: '600', color: C.text },
  featureSub: { fontSize: Math.round(12 * C.textScale), color: C.textMuted, marginTop: 1 },
  checkmark: { fontSize: Math.round(15 * C.textScale), color: '#34C759', fontWeight: '700' },

  pricingCard: { borderRadius: 20, padding: 16 },
  pricingLabel: { fontSize: Math.round(11 * C.textScale), fontWeight: '700', letterSpacing: 1.2, color: C.accent, textTransform: 'uppercase', marginBottom: 12 },
  pricingRow: { flexDirection: 'row', gap: 12 },
  pricingOption: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  pricingOptionHighlight: { borderColor: C.accent, backgroundColor: 'rgba(0,0,0,0.04)' },
  pricingBadge: { fontSize: Math.round(9 * C.textScale), fontWeight: '800', letterSpacing: 1, color: C.accent, textTransform: 'uppercase', marginBottom: 6 },
  pricingAmount: { fontSize: Math.round(26 * C.textScale), fontWeight: '800', color: C.text },
  pricingPeriod: { fontSize: Math.round(12 * C.textScale), color: C.textMuted, marginTop: 2 },
  pricingSavings: { fontSize: Math.round(11 * C.textScale), fontWeight: '700', color: '#34C759', marginTop: 4 },
  pricingAmountAlt: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.textSub, marginTop: 14 },
  pricingPeriodAlt: { fontSize: Math.round(12 * C.textScale), color: C.textMuted, marginTop: 2 },

  upgradeBtn: { backgroundColor: C.accent, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  upgradeBtnText: { color: '#fff', fontSize: Math.round(17 * C.textScale), fontWeight: '800', letterSpacing: 0.3 },

  laterText: { textAlign: 'center', color: C.textMuted, fontSize: Math.round(14 * C.textScale), paddingVertical: 4 },
  legalText: { fontSize: Math.round(10 * C.textScale), color: C.textMuted, textAlign: 'center', lineHeight: 15, paddingHorizontal: 8 },
});
