import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Image, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';

type PhotographerEntry = {
  device_id: string;
  username: string;
  profile_pic: string | null;
  business_name: string | null;
  location: string | null;
  item_count: number;
};

export default function StoreScreen({ navigation }: any) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();

  const [entries, setEntries] = useState<PhotographerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStores = async () => {
    try {
      // Get all store items to find unique device_ids with counts
      const { data: items, error } = await supabase
        .from('store_items')
        .select('device_id');

      if (error || !items) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Build a map of device_id -> count
      const countMap: Record<string, number> = {};
      for (const item of items) {
        countMap[item.device_id] = (countMap[item.device_id] ?? 0) + 1;
      }

      const deviceIds = Object.keys(countMap);
      if (deviceIds.length === 0) {
        setEntries([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch profiles for those device_ids
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('device_id, username, profile_pic, business_name, location')
        .in('device_id', deviceIds);

      if (profError || !profiles) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const result: PhotographerEntry[] = profiles.map(p => ({
        device_id: p.device_id,
        username: p.username,
        profile_pic: p.profile_pic ?? null,
        business_name: p.business_name ?? null,
        location: p.location ?? null,
        item_count: countMap[p.device_id] ?? 0,
      }));

      // Sort by item count descending
      result.sort((a, b) => b.item_count - a.item_count);
      setEntries(result);
    } catch {
      // table may not exist yet — fail gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStores();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <Text style={styles.heading}>Store</Text>
        <Text style={styles.subheading}>Browse photographer stores</Text>
      </GlassPanel>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.device_id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
          }
          ListEmptyComponent={
            <GlassPanel style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🛍️</Text>
              <Text style={styles.emptyTitle}>No Stores Yet</Text>
              <Text style={styles.emptyText}>
                Photographers can add store items from their profile page.
              </Text>
            </GlassPanel>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PhotographerStore', {
                deviceId: item.device_id,
                username: item.username,
              })}
            >
              <GlassPanel style={styles.card}>
                <View style={styles.cardInner}>
                  {item.profile_pic ? (
                    <Image source={{ uri: item.profile_pic }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderText}>
                        {item.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.cardText}>
                    <Text style={styles.cardUsername}>@{item.username}</Text>
                    {item.business_name ? (
                      <Text style={styles.cardBusiness}>{item.business_name}</Text>
                    ) : null}
                    {item.location ? (
                      <Text style={styles.cardLocation}>📍 {item.location}</Text>
                    ) : null}
                    <Text style={styles.cardCount}>
                      {item.item_count} item{item.item_count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.cardArrow}>›</Text>
                </View>
              </GlassPanel>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { borderRadius: 18, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },
  subheading: { fontSize: Math.round(14 * C.textScale), color: C.textSub, marginTop: 2 },

  list: { paddingTop: 4, gap: 10 },

  card: { borderRadius: 18, overflow: 'hidden' },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.accentSubtle,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPlaceholderText: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.accent },
  cardText: { flex: 1 },
  cardUsername: { fontSize: Math.round(16 * C.textScale), fontWeight: '700', color: C.text, marginBottom: 2 },
  cardBusiness: { fontSize: Math.round(13 * C.textScale), color: C.textSub, marginBottom: 2 },
  cardLocation: { fontSize: Math.round(12 * C.textScale), color: C.textMuted, marginBottom: 3 },
  cardCount: { fontSize: Math.round(12 * C.textScale), fontWeight: '600', color: C.accent },
  cardArrow: { fontSize: Math.round(24 * C.textScale), color: C.textMuted, marginLeft: 4 },

  emptyCard: { borderRadius: 20, alignItems: 'center', padding: 40, marginTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: Math.round(18 * C.textScale), fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: Math.round(14 * C.textScale), color: C.textSub, textAlign: 'center', lineHeight: 20 },
});
