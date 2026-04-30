import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, FlatList, Modal, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';
import { PHOTO_SPECIALTIES } from '../lib/specialties';

type Photographer = {
  id: string;
  device_id: string;
  username: string;
  person_name?: string;
  business_name?: string;
  location?: string;
  profile_pic?: string;
  specialty?: string;
};

type PayFilter = '' | 'under_500' | '500_1000' | 'over_1000';

const PAY_OPTIONS: { key: PayFilter; label: string }[] = [
  { key: '',           label: 'Any Rate'       },
  { key: 'under_500',  label: 'Budget (<$500)' },
  { key: '500_1000',   label: 'Mid ($500–$1k)' },
  { key: 'over_1000',  label: 'Premium ($1k+)' },
];

export default function PhotographerSearchScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [locationQuery, setLocationQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPay, setSelectedPay] = useState<PayFilter>('');
  const [specialtyPickerVisible, setSpecialtyPickerVisible] = useState(false);
  const [results, setResults] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);

    // If pay filter set, get matching device_ids from job_postings first
    let deviceIds: string[] | null = null;
    if (selectedPay) {
      const { data: postings } = await supabase.from('job_postings').select('device_id, pay');
      if (postings) {
        const filtered = postings.filter(p => {
          if (!p.pay) return false;
          const match = p.pay.replace(/,/g, '').match(/\d+/);
          const amount = match ? parseInt(match[0], 10) : null;
          if (amount === null) return false;
          if (selectedPay === 'under_500')  return amount < 500;
          if (selectedPay === '500_1000')   return amount >= 500 && amount <= 1000;
          if (selectedPay === 'over_1000')  return amount > 1000;
          return true;
        });
        deviceIds = [...new Set(filtered.map(p => p.device_id).filter(Boolean))] as string[];
        if (deviceIds.length === 0) { setResults([]); setLoading(false); return; }
      }
    }

    let q = supabase
      .from('profiles')
      .select('id, device_id, username, person_name, business_name, location, profile_pic, specialty')
      .limit(50);

    if (locationQuery.trim()) q = (q as any).ilike('location', `%${locationQuery.trim()}%`);
    if (selectedType)         q = (q as any).eq('specialty', selectedType);
    if (deviceIds)            q = (q as any).in('device_id', deviceIds);

    const { data } = await q;
    setResults(data ?? []);
    setLoading(false);
  };

  return (
    <>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <GlassPanel style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Photographer Search</Text>
        </GlassPanel>

        <GlassPanel style={styles.filterCard}>
          {/* Location */}
          <Text style={styles.filterLabel}>Location</Text>
          <GlassPanel style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={locationQuery}
              onChangeText={setLocationQuery}
              placeholder="City, state, or region…"
              placeholderTextColor={C.textMuted}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          </GlassPanel>

          {/* Specialty picker */}
          <Text style={styles.filterLabel}>Specialty</Text>
          <TouchableOpacity onPress={() => setSpecialtyPickerVisible(true)}>
            <GlassPanel style={styles.pickerRow}>
              <Text style={selectedType ? styles.pickerValue : styles.pickerPlaceholder}>
                {selectedType || 'Any specialty…'}
              </Text>
              <Text style={styles.pickerChevron}>▾</Text>
            </GlassPanel>
          </TouchableOpacity>

          {/* Rate */}
          <Text style={styles.filterLabel}>Rate</Text>
          <View style={styles.payRow}>
            {PAY_OPTIONS.map(({ key, label }) => (
              <TouchableOpacity
                key={key || '__any'}
                style={[styles.payChip, selectedPay === key && styles.chipActive]}
                onPress={() => setSelectedPay(key)}
              >
                <Text style={[styles.chipText, selectedPay === key && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.85}>
            <Text style={styles.searchBtnText}>🔍  Search</Text>
          </TouchableOpacity>
        </GlassPanel>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={C.accent} /></View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              searched ? (
                <GlassPanel style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No photographers found.{'\n'}Try adjusting your filters.</Text>
                </GlassPanel>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Profile', { viewDeviceId: item.device_id })}
              >
                <GlassPanel style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={styles.avatar}>
                      {item.profile_pic
                        ? <Image source={{ uri: item.profile_pic }} style={styles.avatarImg} />
                        : <Text style={styles.avatarPlaceholder}>📷</Text>}
                    </View>
                    <View style={styles.cardText}>
                      {item.business_name
                        ? <Text style={styles.cardName}>{item.business_name}</Text>
                        : null}
                      <Text style={[styles.cardUsername, !item.business_name && styles.cardNameLg]}>
                        @{item.username}
                      </Text>
                      {item.location
                        ? <Text style={styles.cardLocation}>📍 {item.location}</Text>
                        : null}
                      {item.specialty
                        ? <Text style={styles.cardSpecialty}>{item.specialty}</Text>
                        : null}
                    </View>
                    <Text style={styles.cardArrow}>›</Text>
                  </View>
                </GlassPanel>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Specialty picker modal */}
      <Modal visible={specialtyPickerVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSpecialtyPickerVisible(false)} />
        <GlassPanel style={styles.pickerSheet}>
          <View style={{ paddingBottom: insets.bottom + 8 }}>
          <View style={styles.pickerSheetHeader}>
            <Text style={styles.pickerSheetTitle}>Select Specialty</Text>
            <TouchableOpacity onPress={() => setSpecialtyPickerVisible(false)}>
              <Text style={styles.pickerSheetDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={['', ...PHOTO_SPECIALTIES]}
            keyExtractor={item => item || '__none'}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => { setSelectedType(item); setSpecialtyPickerVisible(false); }}
              >
                <Text style={[styles.pickerItemText, selectedType === item && styles.pickerItemSelected]}>
                  {item || 'Any'}
                </Text>
                {selectedType === item && <Text style={styles.pickerCheck}>✓</Text>}
              </TouchableOpacity>
            )}
          />
          </View>
        </GlassPanel>
      </Modal>
    </>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  header: { borderRadius: 18, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 8 },
  back: { color: C.accent, fontSize: Math.round(15 * C.textScale), marginBottom: 4 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },

  filterCard: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  filterLabel: { fontSize: Math.round(12 * C.textScale), fontWeight: '700', color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 10 },

  inputWrap: { borderRadius: 12 },
  input: { paddingHorizontal: 14, paddingVertical: 11, fontSize: Math.round(15 * C.textScale), color: C.text },

  pickerRow: { borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13 },
  pickerValue: { fontSize: Math.round(15 * C.textScale), color: C.text, flex: 1 },
  pickerPlaceholder: { fontSize: Math.round(15 * C.textScale), color: C.textMuted, flex: 1 },
  pickerChevron: { fontSize: Math.round(16 * C.textScale), color: C.textSub },

  payRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  payChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.accentSubtle, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontSize: Math.round(13 * C.textScale), fontWeight: '600', color: C.textSub },
  chipTextActive: { color: '#fff' },

  searchBtn: { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  searchBtnText: { color: '#fff', fontSize: Math.round(15 * C.textScale), fontWeight: '700' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { gap: 10, paddingBottom: 100 },

  emptyCard: { borderRadius: 18, padding: 32, alignItems: 'center', marginTop: 20 },
  emptyText: { color: C.textSub, fontSize: Math.round(15 * C.textScale), textAlign: 'center', lineHeight: 24 },

  card: { borderRadius: 16 },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', backgroundColor: C.accentSubtle, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarImg: { width: 52, height: 52 },
  avatarPlaceholder: { fontSize: Math.round(24 * C.textScale) },
  cardText: { flex: 1 },
  cardName: { fontSize: Math.round(15 * C.textScale), fontWeight: '700', color: C.text },
  cardNameLg: { fontSize: Math.round(15 * C.textScale), fontWeight: '700', color: C.text },
  cardUsername: { fontSize: Math.round(12 * C.textScale), color: C.textMuted, marginTop: 1 },
  cardLocation: { fontSize: Math.round(12 * C.textScale), color: C.textSub, marginTop: 3 },
  cardSpecialty: { fontSize: Math.round(11 * C.textScale), color: C.accent, fontWeight: '600', marginTop: 3 },
  cardArrow: { fontSize: Math.round(22 * C.textScale), color: C.textMuted, marginLeft: 8 },

  modalOverlay: { flex: 1 },
  pickerSheet: { borderRadius: 24, marginHorizontal: 12, marginBottom: 12, maxHeight: '60%' },
  pickerSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerSheetTitle: { fontSize: Math.round(17 * C.textScale), fontWeight: '600', color: C.text },
  pickerSheetDone: { color: C.accent, fontSize: Math.round(16 * C.textScale), fontWeight: '600' },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerItemText: { fontSize: Math.round(16 * C.textScale), color: C.textSub },
  pickerItemSelected: { color: C.text, fontWeight: '600' },
  pickerCheck: { color: C.accent, fontSize: Math.round(16 * C.textScale), fontWeight: '700' },
});
