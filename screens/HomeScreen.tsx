import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';

// States reachable within ~4 hours driving from each state
const STATE_NEIGHBORS: Record<string, string[]> = {
  OR: ['OR','WA','CA','ID','NV'],
  WA: ['WA','OR','ID','MT'],
  CA: ['CA','OR','NV','AZ'],
  ID: ['ID','OR','WA','MT','WY','UT','NV'],
  NV: ['NV','CA','OR','ID','UT','AZ'],
  MT: ['MT','ID','WA','WY','ND','SD'],
  UT: ['UT','ID','NV','AZ','CO','WY'],
  AZ: ['AZ','CA','NV','UT','NM'],
  CO: ['CO','UT','WY','NE','KS','OK','NM'],
  WY: ['WY','MT','ID','UT','CO','NE','SD'],
  NM: ['NM','AZ','CO','OK','TX'],
  TX: ['TX','NM','OK','AR','LA'],
  OK: ['OK','TX','KS','MO','AR','CO','NM'],
  KS: ['KS','OK','CO','NE','MO'],
  NE: ['NE','KS','CO','WY','SD','IA','MO'],
  SD: ['SD','NE','WY','MT','ND','MN','IA'],
  ND: ['ND','SD','MT','MN'],
  MN: ['MN','ND','SD','IA','WI'],
  IA: ['IA','MN','SD','NE','MO','IL','WI'],
  MO: ['MO','IA','NE','KS','OK','AR','TN','KY','IL'],
  AR: ['AR','MO','OK','TX','LA','MS','TN'],
  LA: ['LA','TX','AR','MS'],
  MS: ['MS','LA','AR','TN','AL'],
  AL: ['AL','MS','TN','GA','FL'],
  FL: ['FL','AL','GA'],
  GA: ['GA','FL','AL','TN','NC','SC'],
  SC: ['SC','GA','NC'],
  NC: ['NC','SC','GA','TN','VA'],
  TN: ['TN','KY','VA','NC','GA','AL','MS','AR','MO'],
  KY: ['KY','TN','VA','WV','OH','IN','IL','MO'],
  VA: ['VA','NC','TN','KY','WV','MD'],
  WV: ['WV','VA','KY','OH','PA','MD'],
  MD: ['MD','VA','WV','PA','DE'],
  PA: ['PA','WV','MD','DE','NJ','NY','OH'],
  OH: ['OH','PA','WV','KY','IN','MI'],
  MI: ['MI','OH','IN','WI'],
  IN: ['IN','OH','KY','IL','MI'],
  IL: ['IL','IN','KY','MO','IA','WI'],
  WI: ['WI','IL','IA','MN','MI'],
  NY: ['NY','PA','NJ','CT','MA','VT'],
  NJ: ['NJ','NY','PA','DE'],
  CT: ['CT','NY','MA','RI'],
  RI: ['RI','CT','MA'],
  MA: ['MA','CT','RI','NY','VT','NH'],
  VT: ['VT','NY','MA','NH'],
  NH: ['NH','VT','MA','ME'],
  ME: ['ME','NH'],
  DE: ['DE','MD','PA','NJ'],
  AK: ['AK'],
  HI: ['HI'],
};

type NearbyPhotographer = {
  id: string;
  device_id: string;
  username: string;
  person_name?: string;
  profile_pic?: string;
};

type ProfileData = {
  username: string;
  business_name: string;
  profile_pic: string;
  location?: string;
  portfolio_1?: string;
  portfolio_2?: string;
  portfolio_3?: string;
  portfolio_4?: string;
  portfolio_5?: string;
};

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  // Height remaining after all fixed content above the bottom cards
  const cardRowHeight = Math.max(120, windowHeight - insets.top - insets.bottom - 90 - 518);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [nearbyPhotographers, setNearbyPhotographers] = useState<NearbyPhotographer[]>([]);
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
          .select('username, business_name, profile_pic, location, portfolio_1, portfolio_2, portfolio_3, portfolio_4, portfolio_5')
          .eq('device_id', deviceId)
          .single();
        if (active && data) setProfile(data);

        // DEBUG: verify basic query works at all
        const { data: allProfiles, error: allErr } = await supabase
          .from('profiles')
          .select('id, username, location')
          .neq('device_id', deviceId)
          .limit(30);
        console.log('[NearYou] all profiles query error:', allErr);
        console.log('[NearYou] all profiles returned:', allProfiles?.length, allProfiles?.map(p => p.location));

        // Extract state from user location
        const rawLocation = data?.location ?? '';
        const parts = rawLocation.trim().split(/,\s*/);
        const userState = parts[parts.length - 1]?.trim().slice(0, 2).toUpperCase() ?? '';
        const states = STATE_NEIGHBORS[userState] ?? (userState ? [userState] : []);
        console.log('[NearYou] userLocation:', rawLocation, '→ state:', userState, '→ searching states:', states);

        if (active) {
          let merged: any[] = [];
          if (states.length > 0) {
            const results = await Promise.all(
              states.map(s =>
                supabase
                  .from('profiles')
                  .select('id, device_id, username, person_name, profile_pic')
                  .ilike('location', `%, ${s}%`)
                  .neq('device_id', deviceId)
                  .limit(20)
              )
            );
            results.forEach((r, i) => {
              console.log(`[NearYou] state ${states[i]}: ${r.data?.length ?? 0} results, error:`, r.error);
            });
            const seen = new Set<string>();
            merged = results
              .flatMap(r => r.data ?? [])
              .filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
          } else {
            // No state detected — show everyone
            merged = allProfiles ?? [];
          }
          console.log('[NearYou] final merged count:', merged.length);
          setNearbyPhotographers(merged);
        }
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
            {nearbyPhotographers.length > 0 ? nearbyPhotographers.map(p => (
              <TouchableOpacity
                key={p.id}
                style={styles.nearYouItem}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('Profile', { viewDeviceId: p.device_id })}
              >
                <View style={styles.nearYouCircle}>
                  {p.profile_pic
                    ? <Image source={{ uri: p.profile_pic }} style={styles.nearYouAvatar} />
                    : <Text style={styles.nearYouInitial}>📷</Text>}
                </View>
                <Text style={styles.nearYouName} numberOfLines={1}>@{p.username}</Text>
              </TouchableOpacity>
            )) : (
              <Text style={styles.nearYouEmpty}>No photographers found nearby yet</Text>
            )}
          </ScrollView>
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

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  container: { flexGrow: 1, paddingBottom: 100, paddingHorizontal: 14 },

  header: { borderRadius: 18, marginBottom: 8 },
  headerInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  userName: { fontSize: Math.round(16 * C.textScale), fontWeight: '700', color: C.text },
  businessName: { fontSize: Math.round(12 * C.textScale), color: C.textSub, marginTop: 2 },
  picCircle: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  picImage: { width: 40, height: 40, borderRadius: 20 },
  picLabel: { fontSize: Math.round(11 * C.textScale), color: C.textSub, fontWeight: '500' },

  sectionLabel: {
    fontSize: Math.round(11 * C.textScale), fontWeight: '700', letterSpacing: 1.5,
    color: C.accent, textAlign: 'center',
    marginBottom: 6,
  },

  featuredCard: {
    borderRadius: 20, overflow: 'hidden', height: 300,
    backgroundColor: '#1e1b4b', marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
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
  featuredLabel: { fontSize: Math.round(11 * C.textScale), fontWeight: '700', letterSpacing: 1.5, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  featuredName: { fontSize: Math.round(24 * C.textScale), fontWeight: '800', color: '#fff', marginBottom: 2 },
  featuredBusiness: { fontSize: Math.round(14 * C.textScale), color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  dots: { flexDirection: 'row', marginTop: 10, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#fff' },

  row: { flexDirection: 'row', gap: 12, marginBottom: 0, height: 160 },
  halfCardWrap: { flex: 1 },
  sunsetBtn: { flex: 1, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  sunsetBtnImage: { width: '100%', height: 160 },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', paddingVertical: 10, alignItems: 'center' },
  cardOverlayText: { color: '#fff', fontSize: Math.round(11 * C.textScale), fontWeight: '700', letterSpacing: 1 },
  halfCard: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 8, borderRadius: 18 },
  halfImage: { width: 100, height: 100 },
  halfLabel: {
    marginTop: 10, fontSize: Math.round(11 * C.textScale), fontWeight: '700',
    letterSpacing: 0.8, color: C.text, textAlign: 'center',
  },

  nearYouCard: { borderRadius: 18, marginBottom: 8, paddingTop: 10, paddingBottom: 6 },
  nearYouRow: { paddingHorizontal: 14, gap: 16 },
  nearYouItem: { alignItems: 'center', width: 64 },
  nearYouCircle: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', borderWidth: 2, borderColor: C.border, marginBottom: 5 },
  nearYouAvatar: { width: '100%', height: '100%' },
  nearYouName: { fontSize: Math.round(11 * C.textScale), color: C.textSub, fontWeight: '500', textAlign: 'center' },
  nearYouComingSoon: { fontSize: Math.round(11 * C.textScale), color: C.textMuted, textAlign: 'center', paddingBottom: 8, marginTop: 2 },
  nearYouInitial: { fontSize: Math.round(24 * C.textScale) },
  nearYouEmpty: { fontSize: Math.round(13 * C.textScale), color: C.textMuted, paddingHorizontal: 16, paddingVertical: 12 },
});
