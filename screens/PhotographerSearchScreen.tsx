import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, Modal, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';
import { PHOTO_SPECIALTIES } from '../lib/specialties';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const STATE_ABBR: Record<string, string> = {
  alabama:'AL', alaska:'AK', arizona:'AZ', arkansas:'AR', california:'CA',
  colorado:'CO', connecticut:'CT', delaware:'DE', florida:'FL', georgia:'GA',
  hawaii:'HI', idaho:'ID', illinois:'IL', indiana:'IN', iowa:'IA', kansas:'KS',
  kentucky:'KY', louisiana:'LA', maine:'ME', maryland:'MD', massachusetts:'MA',
  michigan:'MI', minnesota:'MN', mississippi:'MS', missouri:'MO', montana:'MT',
  nebraska:'NE', nevada:'NV', 'new hampshire':'NH', 'new jersey':'NJ',
  'new mexico':'NM', 'new york':'NY', 'north carolina':'NC', 'north dakota':'ND',
  ohio:'OH', oklahoma:'OK', oregon:'OR', pennsylvania:'PA', 'rhode island':'RI',
  'south carolina':'SC', 'south dakota':'SD', tennessee:'TN', texas:'TX',
  utah:'UT', vermont:'VT', virginia:'VA', washington:'WA', 'west virginia':'WV',
  wisconsin:'WI', wyoming:'WY',
};

type Photographer = {
  id: string;
  device_id: string;
  username: string;
  person_name?: string;
  business_name?: string;
  location?: string;
  profile_pic?: string;
  pricing_tier?: string;
};

type PayFilter = '' | 'under_500' | '500_1000' | 'over_1000';

const PAY_OPTIONS: { key: PayFilter; label: string }[] = [
  { key: '',           label: 'Any'      },
  { key: 'under_500',  label: '< $500'   },
  { key: '500_1000',   label: '$500–$1k' },
  { key: 'over_1000',  label: '$1k+'     },
];

function matchesLocation(location: string | undefined, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const loc = (location ?? '').toLowerCase();
  if (loc.includes(q)) return true;
  const abbr = STATE_ABBR[q];
  if (abbr) return loc.includes(`, ${abbr.toLowerCase()}`) || loc.endsWith(` ${abbr.toLowerCase()}`);
  return false;
}

export default function PhotographerSearchScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [allProfiles, setAllProfiles]         = useState<Photographer[]>([]);
  const [paidDeviceIds, setPaidDeviceIds]     = useState<Map<string, number>>(new Map());
  const [endorsedIds, setEndorsedIds]         = useState<Set<string>>(new Set());
  const [locationQuery, setLocationQuery]     = useState('');
  const [selectedType, setSelectedType]       = useState('');
  const [selectedPay, setSelectedPay]         = useState<PayFilter>('');
  const [selectedTier, setSelectedTier]       = useState('');
  const [endorsedOnly, setEndorsedOnly]       = useState(false);
  const [specialtyPickerVisible, setSpecialtyPickerVisible] = useState(false);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, device_id, username, person_name, business_name, location, profile_pic, pricing_tier')
      .limit(10000)
      .then(({ data }) => { setAllProfiles(data ?? []); setLoading(false); });

    supabase
      .from('job_postings')
      .select('device_id, pay')
      .then(({ data }) => {
        const map = new Map<string, number>();
        (data ?? []).forEach(p => {
          if (!p.device_id || !p.pay) return;
          const match = p.pay.replace(/,/g, '').match(/\d+/);
          if (match) {
            const amt = parseInt(match[0], 10);
            const existing = map.get(p.device_id);
            if (!existing || amt > existing) map.set(p.device_id, amt);
          }
        });
        setPaidDeviceIds(map);
      });

    supabase
      .from('endorsements')
      .select('profile_device_id')
      .limit(10000)
      .then(({ data }) => {
        const ids = new Set((data ?? []).map((e: any) => e.profile_device_id).filter(Boolean));
        setEndorsedIds(ids);
      });
  }, []);

  const filtered = useMemo(() => {
    return allProfiles.filter(p => {
      if (!matchesLocation(p.location, locationQuery)) return false;
      if (endorsedOnly && !endorsedIds.has(p.device_id)) return false;
      if (selectedTier && p.pricing_tier !== selectedTier) return false;
      if (selectedPay) {
        const amt = paidDeviceIds.get(p.device_id);
        if (amt === undefined) return false;
        if (selectedPay === 'under_500'  && amt >= 500)               return false;
        if (selectedPay === '500_1000'   && (amt < 500 || amt > 1000)) return false;
        if (selectedPay === 'over_1000'  && amt <= 1000)              return false;
      }
      return true;
    });
  }, [allProfiles, locationQuery, selectedType, selectedTier, selectedPay, endorsedOnly, paidDeviceIds, endorsedIds]);

  const canGoBack = navigation.canGoBack?.() ?? false;

  return (
    <>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <GlassPanel style={styles.header}>
          {canGoBack && (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.back}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.heading}>Find Photographers</Text>
        </GlassPanel>

        <GlassPanel style={styles.filterCard}>
          <GlassPanel style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={locationQuery}
              onChangeText={setLocationQuery}
              placeholder="Search by city, state, or region…"
              placeholderTextColor={C.textMuted}
              clearButtonMode="while-editing"
            />
          </GlassPanel>

          <TouchableOpacity style={styles.pickerBtn} onPress={() => setSpecialtyPickerVisible(true)}>
            <Text style={selectedType ? styles.pickerValue : styles.pickerPlaceholder}>
              {selectedType || 'Any specialty…'}
            </Text>
            <Text style={styles.pickerChevron}>▾</Text>
          </TouchableOpacity>

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

          {/* Pricing tier */}
          <View style={styles.payRow}>
            {['', '$', '$$', '$$$', '$$$$'].map(tier => (
              <TouchableOpacity
                key={tier || '__any'}
                style={[styles.payChip, selectedTier === tier && styles.chipActive]}
                onPress={() => setSelectedTier(tier)}
              >
                <Text style={[styles.chipText, selectedTier === tier && styles.chipTextActive]}>
                  {tier || 'Any'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Endorsed filter */}
          <TouchableOpacity
            style={[styles.endorsedChip, endorsedOnly && styles.chipActive]}
            onPress={() => setEndorsedOnly(v => !v)}
          >
            <MaterialCommunityIcons
              name="trophy-outline"
              size={15}
              color={endorsedOnly ? '#fff' : C.accent}
            />
            <Text style={[styles.endorsedChipText, endorsedOnly && styles.chipTextActive]}>
              Has Endorsements
            </Text>
          </TouchableOpacity>
        </GlassPanel>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={C.accent} /></View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <GlassPanel style={styles.emptyCard}>
                <Text style={styles.emptyText}>No photographers found.</Text>
              </GlassPanel>
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
                    </View>
                    <View style={styles.cardRight}>
                      {item.pricing_tier ? (
                        <Text style={styles.pricingBadge}>{item.pricing_tier}</Text>
                      ) : null}
                      {endorsedIds.has(item.device_id) && (
                        <MaterialCommunityIcons name="trophy" size={18} color={C.accent} />
                      )}
                      <Text style={styles.cardArrow}>›</Text>
                    </View>
                  </View>
                </GlassPanel>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

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
  header: { borderRadius: 18, marginBottom: 10, paddingHorizontal: 16, paddingVertical: 8 },
  back: { color: C.accent, fontSize: Math.round(15 * C.textScale), marginBottom: 4 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },

  filterCard: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, gap: 10 },
  inputWrap: { borderRadius: 12 },
  input: { paddingHorizontal: 14, paddingVertical: 11, fontSize: Math.round(15 * C.textScale), color: C.text },

  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.accentSubtle, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: C.border },
  pickerValue: { fontSize: Math.round(15 * C.textScale), color: C.text, flex: 1 },
  pickerPlaceholder: { fontSize: Math.round(15 * C.textScale), color: C.textMuted, flex: 1 },
  pickerChevron: { fontSize: Math.round(15 * C.textScale), color: C.textSub },

  payRow: { flexDirection: 'row', gap: 8 },
  payChip: { flex: 1, alignItems: 'center', borderRadius: 20, paddingVertical: 7, backgroundColor: C.accentSubtle, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontSize: Math.round(12 * C.textScale), fontWeight: '600', color: C.textSub },
  chipTextActive: { color: '#fff' },

  endorsedChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: C.accentSubtle, borderWidth: 1, borderColor: C.border, alignSelf: 'flex-start' },
  endorsedChipText: { fontSize: Math.round(13 * C.textScale), fontWeight: '600', color: C.accent },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { gap: 10, paddingBottom: 100 },
  emptyCard: { borderRadius: 18, padding: 32, alignItems: 'center', marginTop: 20 },
  emptyText: { color: C.textSub, fontSize: Math.round(15 * C.textScale), textAlign: 'center' },

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
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardArrow: { fontSize: Math.round(22 * C.textScale), color: C.textMuted },
  pricingBadge: { fontSize: Math.round(13 * C.textScale), fontWeight: '700', color: C.accent },

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
