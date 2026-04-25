import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { GlassPanel, GLASS } from '../components/Glass';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';

const PLACEHOLDER_PHOTOGRAPHERS = [
  { id: 1,  name: 'Alex M.',    avatar: 'https://i.pravatar.cc/100?img=11' },
  { id: 2,  name: 'Jordan R.',  avatar: 'https://i.pravatar.cc/100?img=5'  },
  { id: 3,  name: 'Sam K.',     avatar: 'https://i.pravatar.cc/100?img=32' },
  { id: 4,  name: 'Casey L.',   avatar: 'https://i.pravatar.cc/100?img=47' },
  { id: 5,  name: 'Morgan T.',  avatar: 'https://i.pravatar.cc/100?img=20' },
  { id: 6,  name: 'Riley P.',   avatar: 'https://i.pravatar.cc/100?img=56' },
  { id: 7,  name: 'Drew V.',    avatar: 'https://i.pravatar.cc/100?img=15' },
  { id: 8,  name: 'Taylor W.',  avatar: 'https://i.pravatar.cc/100?img=39' },
  { id: 9,  name: 'Quinn B.',   avatar: 'https://i.pravatar.cc/100?img=25' },
  { id: 10, name: 'Avery N.',   avatar: 'https://i.pravatar.cc/100?img=44' },
];

type ProfileData = {
  username: string;
  business_name: string;
  profile_pic: string;
  portfolio_1?: string;
  portfolio_2?: string;
  portfolio_3?: string;
  portfolio_4?: string;
  portfolio_5?: string;
};

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // Height remaining after all fixed content above the bottom cards
  const cardRowHeight = Math.max(120, windowHeight - insets.top - insets.bottom - 90 - 518);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const deviceId = await getDeviceId();
        const { data } = await supabase
          .from('profiles')
          .select('username, business_name, profile_pic, portfolio_1, portfolio_2, portfolio_3, portfolio_4, portfolio_5')
          .eq('device_id', deviceId)
          .single();
        if (active && data) setProfile(data);
      })();
      return () => { active = false; };
    }, [])
  );

  const portfolioPics = profile
    ? ([profile.portfolio_1, profile.portfolio_2, profile.portfolio_3, profile.portfolio_4, profile.portfolio_5]
        .filter((x): x is string => Boolean(x)))
    : [];
  const slideshowImages = portfolioPics.length > 0
    ? portfolioPics
    : profile?.profile_pic ? [profile.profile_pic] : [];

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSlideIndex(0);
    fadeAnim.setValue(1);
    if (slideshowImages.length <= 1) return;
    intervalRef.current = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 800, useNativeDriver: true }).start(() => {
        setSlideIndex(prev => (prev + 1) % slideshowImages.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      });
    }, 6000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} scrollEnabled={false}>

        {/* Header */}
        <GlassPanel style={styles.header}>
          <View style={styles.headerInner}>
            <View>
              <Text style={styles.userName}>{profile?.username ? `@${profile.username}` : 'User Name'}</Text>
              {profile?.business_name ? <Text style={styles.businessName}>{profile.business_name}</Text> : null}
            </View>
            <TouchableOpacity style={styles.picCircle} onPress={() => navigation.navigate('Profile')}>
              {profile?.profile_pic
                ? <Image source={{ uri: profile.profile_pic }} style={styles.picImage} />
                : <Text style={styles.picLabel}>PIC</Text>}
            </TouchableOpacity>
          </View>
        </GlassPanel>

        {/* Section label */}
        <Text style={styles.sectionLabel}>PHOTOGRAPHERS NEAR YOU</Text>

        {/* Placeholder photographer row */}
        <GlassPanel style={styles.nearYouCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearYouRow}>
            {PLACEHOLDER_PHOTOGRAPHERS.map(p => (
              <View key={p.id} style={styles.nearYouItem}>
                <View style={styles.nearYouCircle}>
                  <Image source={{ uri: p.avatar }} style={styles.nearYouAvatar} />
                </View>
                <Text style={styles.nearYouName} numberOfLines={1}>{p.name}</Text>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.nearYouComingSoon}>More photographers coming soon</Text>
        </GlassPanel>

        {/* Featured card */}
        <TouchableOpacity activeOpacity={0.92} onPress={() => navigation.navigate('Profile')} style={styles.featuredCard}>
          {slideshowImages.length > 0 ? (
            <Animated.Image
              source={{ uri: slideshowImages[slideIndex] }}
              style={[styles.featuredPhoto, { opacity: fadeAnim }]}
              resizeMode="cover"
            />
          ) : (
            <Image source={require('../assets/photographer_of_month.png')} style={styles.featuredPhoto} resizeMode="cover" />
          )}
          <View style={styles.featuredOverlay} />
          <View style={styles.featuredTextBlock}>
            <Text style={styles.featuredLabel}>FEATURED PHOTOGRAPHER</Text>
            {profile?.username ? <Text style={styles.featuredName}>@{profile.username}</Text> : null}
            {profile?.business_name ? <Text style={styles.featuredBusiness}>{profile.business_name}</Text> : null}
            {slideshowImages.length > 1 && (
              <View style={styles.dots}>
                {slideshowImages.map((_, i) => (
                  <View key={i} style={[styles.dot, i === slideIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Job Referral + Sunset Calculator */}
        <View style={[styles.row, { height: cardRowHeight }]}>
          <TouchableOpacity style={styles.sunsetBtn} onPress={() => navigation.navigate('ComingSoon', { title: 'Job Referral' })}>
            <Image source={require('../assets/PT_Job_Referral_Icon.png')} style={[styles.sunsetBtnImage, { height: cardRowHeight }]} resizeMode="cover" />
            <View style={styles.cardOverlay}>
              <Text style={styles.cardOverlayText}>JOB REFERRALS</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sunsetBtn} onPress={() => navigation.navigate('SunsetCalculator')}>
            <Image source={require('../assets/PT_Sun_Calculator_Icon.png')} style={[styles.sunsetBtnImage, { height: cardRowHeight }]} resizeMode="cover" />
            <View style={styles.cardOverlay}>
              <Text style={styles.cardOverlayText}>SUN CALCULATOR</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  container: { flexGrow: 1, paddingBottom: 100, paddingHorizontal: 14 },

  header: { borderRadius: 18, marginBottom: 8 },
  headerInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  userName: { fontSize: 16, fontWeight: '700', color: GLASS.text },
  businessName: { fontSize: 12, color: GLASS.textSub, marginTop: 2 },
  picCircle: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, borderColor: GLASS.border,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  picImage: { width: 40, height: 40, borderRadius: 20 },
  picLabel: { fontSize: 11, color: GLASS.textSub, fontWeight: '500' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    color: GLASS.textMuted, textAlign: 'center',
    marginBottom: 6,
  },

  featuredCard: {
    borderRadius: 20, overflow: 'hidden', height: 300,
    backgroundColor: '#1e1b4b', marginBottom: 8,
    borderWidth: 1, borderColor: GLASS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 20,
  },
  featuredPhoto: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  featuredOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  featuredTextBlock: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 18, paddingBottom: 18, paddingTop: 40,
  },
  featuredLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  featuredName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 2 },
  featuredBusiness: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  dots: { flexDirection: 'row', marginTop: 10, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#fff' },

  row: { flexDirection: 'row', gap: 12, marginBottom: 0, height: 160 },
  halfCardWrap: { flex: 1 },
  sunsetBtn: { flex: 1, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: GLASS.border },
  sunsetBtnImage: { width: '100%', height: 160 },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', paddingVertical: 10, alignItems: 'center' },
  cardOverlayText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  halfCard: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 8, borderRadius: 18 },
  halfImage: { width: 100, height: 100 },
  halfLabel: {
    marginTop: 10, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, color: GLASS.text, textAlign: 'center',
  },

  nearYouCard: { borderRadius: 18, marginBottom: 8, paddingTop: 10, paddingBottom: 6 },
  nearYouRow: { paddingHorizontal: 14, gap: 16 },
  nearYouItem: { alignItems: 'center', width: 64 },
  nearYouCircle: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', borderWidth: 2, borderColor: GLASS.border, marginBottom: 5 },
  nearYouAvatar: { width: '100%', height: '100%' },
  nearYouName: { fontSize: 11, color: GLASS.textSub, fontWeight: '500', textAlign: 'center' },
  nearYouComingSoon: { fontSize: 11, color: GLASS.textMuted, textAlign: 'center', paddingBottom: 8, marginTop: 2 },
});
