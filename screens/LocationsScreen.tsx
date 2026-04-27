import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Image, Modal, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import MapView, { Marker, LongPressEvent } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';

type ScoutedLocation = {
  id: string;
  name: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
  posted_by?: string;
  device_id?: string;
  created_at: string;
};

const DEFAULT_REGION = {
  latitude: 39.5,
  longitude: -98.35,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

export default function LocationsScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [locations, setLocations] = useState<ScoutedLocation[]>([]);
  const [filtered, setFiltered] = useState<ScoutedLocation[]>([]);
  const [search, setSearch] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [selected, setSelected] = useState<ScoutedLocation | null>(null);
  const [deviceId, setDeviceId] = useState('');

  // Add location modal
  const [addVisible, setAddVisible] = useState(false);
  const [pendingCoord, setPendingCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [addName, setAddName] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    const { data } = await supabase
      .from('scouted_locations')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) { setLocations(data); setFiltered(data); }
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
    const q = text.toLowerCase().trim();
    if (!q) { setFiltered(locations); return; }
    setFiltered(locations.filter(l =>
      l.name.toLowerCase().includes(q) ||
      (l.address ?? '').toLowerCase().includes(q) ||
      (l.description ?? '').toLowerCase().includes(q)
    ));
  };

  const handleSearchSubmit = async () => {
    const q = search.trim();
    if (!q) return;
    try {
      setGeocoding(true);
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`);
      const json = await res.json();
      const features = json?.features;
      if (features?.length > 0) {
        const [lng, lat] = features[0].geometry.coordinates;
        mapRef.current?.animateToRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }, 800);
      }
    } catch { /* ignore */ }
    finally { setGeocoding(false); }
  };

  const handleLongPress = (e: LongPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPendingCoord({ lat: latitude, lng: longitude });
    setAddName(''); setAddDescription(''); setAddAddress('');
    setAddVisible(true);
    // Reverse geocode for address pre-fill
    fetch(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}&limit=1`)
      .then(r => r.json())
      .then(d => {
        const p = d?.features?.[0]?.properties;
        if (p) setAddAddress([p.name, p.street, p.city, p.state].filter(Boolean).join(', '));
      })
      .catch(() => {});
  };

  const handleAddLocation = async () => {
    if (!addName.trim()) { Alert.alert('Required', 'Please enter a location name.'); return; }
    if (!pendingCoord) return;
    setAddLoading(true);
    const { data: prof } = await supabase.from('profiles').select('username').eq('device_id', deviceId).single();
    const { error } = await supabase.from('scouted_locations').insert([{
      name: addName.trim(),
      description: addDescription.trim() || null,
      address: addAddress.trim() || null,
      latitude: pendingCoord.lat,
      longitude: pendingCoord.lng,
      device_id: deviceId,
      posted_by: prof?.username ?? '',
    }]);
    setAddLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setAddVisible(false);
    setPendingCoord(null);
    fetchLocations();
  };

  const zoomTo = (loc: ScoutedLocation) => {
    mapRef.current?.animateToRegion({
      latitude: loc.latitude,
      longitude: loc.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 600);
    setSelected(loc);
  };

  return (
    <>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>Scout Locations</Text>
          <GlassPanel style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search parks, venues, cityscapes..."
              placeholderTextColor={C.textMuted}
              value={search}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {geocoding ? <ActivityIndicator size="small" color={C.accent} style={{ marginRight: 8 }} /> : null}
          </GlassPanel>
        </View>

        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={DEFAULT_REGION}
          onLongPress={handleLongPress}
          onPress={() => setSelected(null)}
          showsUserLocation
          showsCompass
        >
          {filtered.filter(loc => loc.latitude !== 0 || loc.longitude !== 0).map(loc => (
            <Marker
              key={loc.id}
              coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
              onPress={() => zoomTo(loc)}
            >
              <View style={styles.marker}>
                <Text style={styles.markerIcon}>📷</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Long press hint */}
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>Long-press anywhere on the map to pin a location</Text>
        </View>

        {/* Selected location detail */}
        {selected ? (
          <GlassPanel style={{ ...styles.detailCard, marginBottom: insets.bottom + 90 }}>
            <View style={styles.detailRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailName}>{selected.name}</Text>
                {selected.address ? <Text style={styles.detailAddress} numberOfLines={2}>📍 {selected.address}</Text> : null}
                {selected.posted_by ? <Text style={styles.detailBy}>Pinned by @{selected.posted_by}</Text> : null}
                {selected.description ? <Text style={styles.detailDesc}>{selected.description}</Text> : null}
              </View>
              {selected.photo_url
                ? <Image source={{ uri: selected.photo_url }} style={styles.detailPhoto} />
                : null}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
          </GlassPanel>
        ) : (
          /* Horizontal cards list */
          <View style={[styles.listSection, { paddingBottom: insets.bottom + 90 }]}>
            <Text style={styles.listLabel}>
              {search.trim()
                ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"`
                : 'Map / Location Search'}
            </Text>
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardList}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No locations yet — long-press the map to add one</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => zoomTo(item)} activeOpacity={0.85}>
                  <GlassPanel style={styles.locationCard}>
                    {item.photo_url
                      ? <Image source={{ uri: item.photo_url }} style={styles.cardPhoto} />
                      : <View style={styles.cardPhotoPlaceholder}><Text style={styles.cardPlaceholderIcon}>📷</Text></View>}
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                      {item.address ? <Text style={styles.cardAddress} numberOfLines={1}>{item.address}</Text> : null}
                    </View>
                  </GlassPanel>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* Add Location Modal */}
      <Modal visible={addVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassPanel style={{ ...styles.addSheet, paddingBottom: insets.bottom + 16 }}>
            <View style={styles.addHeader}>
              <Text style={styles.addTitle}>📍 Scout This Spot</Text>
              <TouchableOpacity onPress={() => setAddVisible(false)}>
                <Text style={styles.addCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.addLabel}>Location Name *</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={styles.input} value={addName} onChangeText={setAddName}
                  placeholder="e.g. Waterfront Park" placeholderTextColor={C.textMuted} />
              </GlassPanel>

              <Text style={styles.addLabel}>Description</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={[styles.input, styles.textArea]} value={addDescription}
                  onChangeText={setAddDescription}
                  placeholder="What makes this a great spot for photography?"
                  placeholderTextColor={C.textMuted} multiline numberOfLines={3} />
              </GlassPanel>

              <Text style={styles.addLabel}>Address</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={styles.input} value={addAddress} onChangeText={setAddAddress}
                  placeholder="Auto-filled from pin" placeholderTextColor={C.textMuted} />
              </GlassPanel>

              <TouchableOpacity
                style={[styles.pinBtn, addLoading && styles.pinDisabled]}
                onPress={handleAddLocation}
                disabled={addLoading}
              >
                {addLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.pinText}>Pin This Location</Text>}
              </TouchableOpacity>
            </ScrollView>
          </GlassPanel>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },

  header: { paddingHorizontal: 16, paddingBottom: 8 },
  heading: { fontSize: Math.round(26 * C.textScale), fontWeight: '800', color: C.text, marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  searchIcon: { fontSize: Math.round(15 * C.textScale), marginRight: 6 },
  searchInput: { flex: 1, fontSize: Math.round(15 * C.textScale), color: C.text },

  map: { flex: 1 },

  marker: { alignItems: 'center', justifyContent: 'center' },
  markerIcon: { fontSize: Math.round(28 * C.textScale) },

  hintBar: { paddingHorizontal: 16, paddingVertical: 6 },
  hintText: { fontSize: Math.round(11 * C.textScale), color: C.textMuted, textAlign: 'center' },

  detailCard: {
    margin: 12, borderRadius: 18, padding: 16,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailName: { fontSize: Math.round(17 * C.textScale), fontWeight: '700', color: C.text, marginBottom: 4 },
  detailAddress: { fontSize: Math.round(13 * C.textScale), color: C.textSub, marginBottom: 4, lineHeight: 18 },
  detailBy: { fontSize: Math.round(12 * C.textScale), color: C.textMuted, marginBottom: 6 },
  detailDesc: { fontSize: Math.round(14 * C.textScale), color: C.textSub, lineHeight: 20, marginTop: 4 },
  detailPhoto: { width: 80, height: 80, borderRadius: 12, marginLeft: 12 },
  closeBtn: { position: 'absolute', top: 0, right: 0, padding: 4 },
  closeText: { fontSize: Math.round(14 * C.textScale), color: C.textMuted, fontWeight: '600' },

  listSection: { paddingTop: 4 },
  listLabel: { fontSize: Math.round(13 * C.textScale), fontWeight: '700', color: C.accent, paddingHorizontal: 16, marginBottom: 8, letterSpacing: 0.3 },
  cardList: { paddingHorizontal: 12, paddingBottom: 16, gap: 10 },
  emptyCard: { paddingHorizontal: 20, paddingVertical: 16, marginLeft: 4 },
  emptyText: { fontSize: Math.round(14 * C.textScale), color: C.textMuted },
  locationCard: { width: 160, borderRadius: 16, overflow: 'hidden' },
  cardPhoto: { width: '100%', height: 100 },
  cardPhotoPlaceholder: { width: '100%', height: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.04)' },
  cardPlaceholderIcon: { fontSize: Math.round(28 * C.textScale) },
  cardInfo: { padding: 10 },
  cardName: { fontSize: Math.round(13 * C.textScale), fontWeight: '700', color: C.text, marginBottom: 2 },
  cardAddress: { fontSize: Math.round(11 * C.textScale), color: C.textMuted },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  addSheet: { borderRadius: 28, marginHorizontal: 0, paddingHorizontal: 20, paddingTop: 20, maxHeight: '75%' },
  addHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  addTitle: { fontSize: Math.round(17 * C.textScale), fontWeight: '700', color: C.text },
  addCancel: { color: C.accent, fontSize: Math.round(15 * C.textScale), fontWeight: '600' },
  addLabel: { fontSize: Math.round(13 * C.textScale), fontWeight: '600', color: C.textSub, marginTop: 14, marginBottom: 6 },
  inputWrap: { borderRadius: 14 },
  input: { paddingHorizontal: 14, paddingVertical: 13, fontSize: Math.round(15 * C.textScale), color: C.text },
  textArea: { height: 90, textAlignVertical: 'top' },
  pinBtn: { backgroundColor: C.accent, paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 20, marginBottom: 4 },
  pinDisabled: { opacity: 0.6 },
  pinText: { color: '#fff', fontSize: Math.round(16 * C.textScale), fontWeight: '700' },
});
