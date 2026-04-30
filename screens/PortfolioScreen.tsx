import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, Switch, FlatList, RefreshControl, Modal, Share,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';

type PublicPortfolio = {
  device_id: string;
  username: string;
  person_name?: string;
  profile_pic?: string;
  portfolio_1?: string;
  portfolio_2?: string;
  portfolio_3?: string;
  portfolio_4?: string;
  portfolio_5?: string;
};

export default function PortfolioScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const [deviceId, setDeviceId] = useState('');
  const [myPics, setMyPics] = useState<(string | null)[]>([null, null, null, null, null]);
  const [uploading, setUploading] = useState<boolean[]>([false, false, false, false, false]);
  const [isPublic, setIsPublic] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [feed, setFeed] = useState<PublicPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myTab, setMyTab] = useState<'feed' | 'mine'>('feed');
  const [fullscreenPhotos, setFullscreenPhotos] = useState<string[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  const openFullscreen = (photos: string[], index: number) => {
    setFullscreenPhotos(photos);
    setFullscreenIndex(index);
  };

  const closeFullscreen = () => setFullscreenPhotos([]);

  const handleShare = async () => {
    const uri = fullscreenPhotos[fullscreenIndex];
    if (!uri) return;
    try {
      await Share.share({ url: uri, message: `Check out this photo: ${uri}` });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  useEffect(() => {
    getDeviceId().then(async id => {
      setDeviceId(id);
      await Promise.all([loadMyProfile(id), loadFeed()]);
      setLoading(false);
    });
  }, []);

  const loadMyProfile = async (id: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('portfolio_1, portfolio_2, portfolio_3, portfolio_4, portfolio_5, portfolio_public')
      .eq('device_id', id)
      .single();
    if (data) {
      setMyPics([
        data.portfolio_1 || null, data.portfolio_2 || null, data.portfolio_3 || null,
        data.portfolio_4 || null, data.portfolio_5 || null,
      ]);
      setIsPublic(data.portfolio_public ?? false);
    }
  };

  const loadFeed = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('device_id, username, person_name, profile_pic, portfolio_1, portfolio_2, portfolio_3, portfolio_4, portfolio_5')
      .eq('portfolio_public', true)
      .order('username', { ascending: true });
    if (data) setFeed(data);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, []);

  const togglePublic = async (value: boolean) => {
    setTogglingPublic(true);
    const { error } = await supabase.from('profiles')
      .update({ portfolio_public: value }).eq('device_id', deviceId);
    if (error) { Alert.alert('Error', error.message); }
    else { setIsPublic(value); await loadFeed(); }
    setTogglingPublic(false);
  };

  const pickPhoto = (index: number) => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async response => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset?.uri) return;
      setUploading(prev => { const n = [...prev]; n[index] = true; return n; });
      try {
        const fileName = `portfolio/${deviceId}_${index + 1}.jpg`;
        const blob = await (await fetch(asset.uri)).blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        const { error: upErr } = await supabase.storage
          .from('avatars').upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
        if (upErr) { Alert.alert('Upload failed', upErr.message); return; }
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        const newUrl = urlData.publicUrl;
        setMyPics(prev => { const n = [...prev]; n[index] = newUrl; return n; });
        const { error: dbErr } = await supabase.from('profiles')
          .update({ [`portfolio_${index + 1}`]: newUrl }).eq('device_id', deviceId);
        if (dbErr) Alert.alert('Save failed', dbErr.message);
      } finally {
        setUploading(prev => { const n = [...prev]; n[index] = false; return n; });
      }
    });
  };

  const portfolioPhotos = (p: PublicPortfolio) =>
    [p.portfolio_1, p.portfolio_2, p.portfolio_3, p.portfolio_4, p.portfolio_5].filter(Boolean) as string[];

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <GlassPanel style={styles.header}>
          <Text style={styles.heading}>Portfolio</Text>
        </GlassPanel>
        <View style={styles.center}><ActivityIndicator size="large" color={C.accent} /></View>
      </View>
    );
  }

  const myPhotos = myPics.filter(Boolean) as string[];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <Text style={styles.heading}>Portfolio</Text>
        <Text style={styles.subheading}>Discover photographer portfolios</Text>
      </GlassPanel>

      <GlassPanel style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, myTab === 'feed' && styles.tabItemActive]}
          onPress={() => setMyTab('feed')}
        >
          <Text style={[styles.tabLabel, myTab === 'feed' && styles.tabLabelActive]}>Community</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, myTab === 'mine' && styles.tabItemActive]}
          onPress={() => setMyTab('mine')}
        >
          <Text style={[styles.tabLabel, myTab === 'mine' && styles.tabLabelActive]}>My Portfolio</Text>
        </TouchableOpacity>
      </GlassPanel>

      {myTab === 'feed' ? (
        <FlatList
          data={feed}
          keyExtractor={item => item.device_id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
          ListEmptyComponent={
            <GlassPanel style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📷</Text>
              <Text style={styles.emptyText}>No public portfolios yet.</Text>
              <Text style={styles.emptySub}>Share yours in the My Portfolio tab!</Text>
            </GlassPanel>
          }
          renderItem={({ item }) => {
            const photos = portfolioPhotos(item);
            if (!photos.length) return null;
            return (
              <GlassPanel style={styles.portfolioCard}>
                <View style={styles.userRow}>
                  {item.profile_pic
                    ? <Image source={{ uri: item.profile_pic }} style={styles.userAvatar} />
                    : <View style={styles.userAvatarPlaceholder}><Text style={styles.userAvatarText}>📷</Text></View>}
                  <View>
                    <Text style={styles.userUsername}>@{item.username}</Text>
                    {item.person_name ? <Text style={styles.userName}>{item.person_name}</Text> : null}
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                  {photos.map((uri, i) => (
                    <TouchableOpacity key={i} onPress={() => openFullscreen(photos, i)} activeOpacity={0.85}>
                      <Image source={{ uri }} style={styles.feedPhoto} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </GlassPanel>
            );
          }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          <GlassPanel style={styles.shareToggleCard}>
            <View style={styles.shareToggleText}>
              <Text style={styles.shareToggleTitle}>Share Publicly</Text>
              <Text style={styles.shareToggleSub}>
                {isPublic ? 'Your portfolio is visible to all users' : 'Only you can see your portfolio'}
              </Text>
            </View>
            {togglingPublic
              ? <ActivityIndicator color={C.accent} />
              : <Switch
                  value={isPublic}
                  onValueChange={togglePublic}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: C.accent }}
                  thumbColor="#fff"
                />}
          </GlassPanel>

          <Text style={styles.hint}>Tap to view · Long-press to replace</Text>
          <View style={styles.grid}>
            {myPics.map((uri, i) => (
              <TouchableOpacity
                key={i}
                style={styles.slot}
                onPress={() => uri ? openFullscreen(myPhotos, myPhotos.indexOf(uri)) : pickPhoto(i)}
                onLongPress={() => pickPhoto(i)}
                activeOpacity={0.8}
              >
                <GlassPanel style={styles.panel}>
                  {uploading[i] ? (
                    <ActivityIndicator color={C.accent} />
                  ) : uri ? (
                    <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
                  ) : (
                    <>
                      <Text style={styles.addIcon}>+</Text>
                      <Text style={styles.addLabel}>Photo {i + 1}</Text>
                    </>
                  )}
                </GlassPanel>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Fullscreen viewer with navigation */}
      <Modal visible={fullscreenPhotos.length > 0} transparent animationType="fade" onRequestClose={closeFullscreen}>
        <View style={styles.fsOverlay}>
          {/* Top bar: prev / counter / next / close */}
          <View style={[styles.fsTopBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={[styles.fsNavBtn, fullscreenIndex === 0 && styles.fsNavBtnDisabled]}
              onPress={() => setFullscreenIndex(i => i - 1)}
              disabled={fullscreenIndex === 0}
            >
              <Text style={styles.fsNavText}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.fsCounterText}>{fullscreenIndex + 1} / {fullscreenPhotos.length}</Text>

            <TouchableOpacity
              style={[styles.fsNavBtn, fullscreenIndex === fullscreenPhotos.length - 1 && styles.fsNavBtnDisabled]}
              onPress={() => setFullscreenIndex(i => i + 1)}
              disabled={fullscreenIndex === fullscreenPhotos.length - 1}
            >
              <Text style={styles.fsNavText}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fsNavBtn} onPress={handleShare}>
              <Text style={styles.fsShareText}>⎙</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fsClose} onPress={closeFullscreen}>
              <Text style={styles.fsCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Image
            source={{ uri: fullscreenPhotos[fullscreenIndex] ?? '' }}
            style={styles.fsImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { borderRadius: 18, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 8 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },
  subheading: { fontSize: Math.round(13 * C.textScale), color: C.textMuted, marginTop: 2 },

  tabBar: { flexDirection: 'row', borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: C.accent },
  tabLabel: { fontSize: Math.round(15 * C.textScale), fontWeight: '600', color: C.textSub },
  tabLabelActive: { color: C.text },

  portfolioCard: { borderRadius: 18, marginBottom: 14, overflow: 'hidden', paddingTop: 14 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginBottom: 10 },
  userAvatar: { width: 40, height: 40, borderRadius: 20 },
  userAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: Math.round(18 * C.textScale) },
  userUsername: { fontSize: Math.round(14 * C.textScale), fontWeight: '700', color: C.text },
  userName: { fontSize: Math.round(12 * C.textScale), color: C.textMuted },
  photoRow: { paddingHorizontal: 14, paddingBottom: 14 },
  feedPhoto: { width: 160, height: 160, borderRadius: 12, marginRight: 10 },

  emptyCard: { borderRadius: 20, alignItems: 'center', padding: 40, marginTop: 20 },
  emptyIcon: { fontSize: Math.round(48 * C.textScale), marginBottom: 12 },
  emptyText: { fontSize: Math.round(17 * C.textScale), fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySub: { fontSize: Math.round(14 * C.textScale), color: C.textMuted, textAlign: 'center' },

  shareToggleCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14 },
  shareToggleText: { flex: 1, marginRight: 12 },
  shareToggleTitle: { fontSize: Math.round(15 * C.textScale), fontWeight: '700', color: C.text },
  shareToggleSub: { fontSize: Math.round(12 * C.textScale), color: C.textMuted, marginTop: 2 },

  hint: { fontSize: Math.round(13 * C.textScale), color: C.textMuted, textAlign: 'center', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  slot: { width: '47%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: C.accentSubtle },
  panel: { flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: '100%' },
  addIcon: { fontSize: Math.round(36 * C.textScale), color: C.textMuted, lineHeight: 40 },
  addLabel: { fontSize: Math.round(12 * C.textScale), color: C.textMuted, marginTop: 4 },

  fsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  fsTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 10, backgroundColor: 'rgba(0,0,0,0.6)' },
  fsNavBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 22 },
  fsNavBtnDisabled: { opacity: 0.25 },
  fsNavText: { color: '#fff', fontSize: Math.round(30 * C.textScale), fontWeight: '300', lineHeight: 36 },
  fsCounterText: { color: '#fff', fontSize: Math.round(15 * C.textScale), fontWeight: '600' },
  fsClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 22 },
  fsCloseText: { color: '#fff', fontSize: Math.round(16 * C.textScale), fontWeight: '700' },
  fsShareText: { color: '#fff', fontSize: Math.round(18 * C.textScale) },
  fsImage: { flex: 1, width: '100%' },
});
