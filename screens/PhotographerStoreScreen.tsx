import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Image, Linking, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';

type StoreItem = {
  id: string;
  device_id: string;
  title: string;
  description: string | null;
  price: string | null;
  image_url: string | null;
  link: string | null;
  created_at: string;
};

export default function PhotographerStoreScreen({ navigation, route }: any) {
  const { deviceId, username } = route.params as { deviceId: string; username: string };
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setItems(data);
      }
    } catch {
      // table may not exist yet — fail gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchItems(); }, [deviceId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const handleOpenLink = (link: string) => {
    const url = link.startsWith('http') ? link : `https://${link}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>@{username}'s Store</Text>
      </GlassPanel>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
          }
          ListEmptyComponent={
            <GlassPanel style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🛍️</Text>
              <Text style={styles.emptyText}>No items in this store yet.</Text>
            </GlassPanel>
          }
          renderItem={({ item }) => (
            <GlassPanel style={styles.card}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
              ) : null}
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.price ? (
                    <Text style={styles.itemPrice}>{item.price}</Text>
                  ) : null}
                </View>
                {item.description ? (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                ) : null}
                {item.link ? (
                  <TouchableOpacity
                    style={styles.linkBtn}
                    onPress={() => handleOpenLink(item.link!)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.linkBtnText}>View Item →</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </GlassPanel>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { borderRadius: 18, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 8 },
  back: { color: C.accent, fontSize: Math.round(15 * C.textScale), marginBottom: 4 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },

  list: { paddingTop: 4, gap: 10 },

  card: { borderRadius: 18, overflow: 'hidden' },
  itemImage: { width: '100%', height: 200 },
  cardBody: { padding: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  itemTitle: { flex: 1, fontSize: Math.round(17 * C.textScale), fontWeight: '700', color: C.text },
  itemPrice: { fontSize: Math.round(16 * C.textScale), fontWeight: '700', color: C.accent },
  itemDescription: { fontSize: Math.round(14 * C.textScale), color: C.textSub, lineHeight: 20, marginBottom: 10 },

  linkBtn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  linkBtnText: { color: '#fff', fontSize: Math.round(14 * C.textScale), fontWeight: '700' },

  emptyCard: { borderRadius: 20, alignItems: 'center', padding: 40, marginTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: Math.round(15 * C.textScale), color: C.textSub, textAlign: 'center' },
});
