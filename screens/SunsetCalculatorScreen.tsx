import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform, Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTimes as getSunTimes } from 'suncalc';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';

type SunEvent = { label: string; emoji: string; time: Date | null; note?: string };
type Coords = { lat: number; lng: number };

const fmt = (d: Date) =>
  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

function buildSchedule(lat: number, lng: number, date: Date): SunEvent[] {
  const times = getSunTimes(date, lat, lng);
  return [
    { label: 'Civil Dawn',          emoji: '🌄', time: times.dawn,          note: 'First usable light' },
    { label: 'Sunrise',             emoji: '🌅', time: times.sunrise,       note: 'Golden light begins' },
    { label: 'Morning Golden Hour', emoji: '✨', time: times.goldenHourEnd, note: 'Soft light ends' },
    { label: 'Solar Noon',          emoji: '☀️', time: times.solarNoon,     note: 'Highest point' },
    { label: 'Evening Golden Hour', emoji: '🌇', time: times.goldenHour,    note: 'Soft light starts' },
    { label: 'Sunset',              emoji: '🌆', time: times.sunset,        note: 'Golden light ends' },
    { label: 'Blue Hour',           emoji: '🌃', time: times.dusk,          note: 'Last usable light' },
  ].filter(e => e.time && !isNaN(e.time.getTime()));
}

export default function SunsetCalculatorScreen({ navigation }: any) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const [locationText, setLocationText] = useState('');
  const [date, setDate] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [schedule, setSchedule] = useState<SunEvent[] | null>(null);
  const [locationName, setLocationName] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCalculate = async () => {
    if (!locationText.trim()) { setError('Please enter a location.'); return; }
    setError('');
    setSaved(false);
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(locationText.trim())}&limit=1`
      );
      const json = await res.json();
      const features = json?.features;
      if (!features?.length) { setError('Location not found. Try a city name or address.'); setGeocoding(false); return; }
      const [lng, lat] = features[0].geometry.coordinates;
      const props = features[0].properties;
      const name = [props.name, props.state ?? props.county, props.country].filter(Boolean).join(', ');
      setCoords({ lat, lng });
      setSchedule(buildSchedule(lat, lng, date));
      setLocationName(name);
    } catch (e: any) {
      setError(`Error: ${e?.message ?? 'Unknown error'}`);
    }
    setGeocoding(false);
  };

  const handleSaveLocation = async () => {
    if (!coords || !locationName) return;
    setSaving(true);
    try {
      const deviceId = await getDeviceId();
      const { data: prof } = await supabase.from('profiles').select('username').eq('device_id', deviceId).single();
      const { error: err } = await supabase.from('scouted_locations').insert([{
        name: locationName,
        latitude: coords.lat,
        longitude: coords.lng,
        device_id: deviceId,
        posted_by: prof?.username ?? '',
      }]);
      if (err) { Alert.alert('Error', err.message); }
      else { setSaved(true); }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    }
    setSaving(false);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const isKeyEvent = (label: string) =>
    ['Sunrise', 'Morning Golden Hour', 'Solar Noon', 'Evening Golden Hour', 'Sunset', 'Blue Hour'].includes(label);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 }]}
      keyboardShouldPersistTaps="handled"
    >
      <GlassPanel style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>🌅 Sunset Calculator</Text>
        <Text style={styles.subheading}>Plan your shoot around perfect light</Text>
      </GlassPanel>

      {/* Location + Date row */}
      <View style={styles.inputRow}>
        <GlassPanel style={styles.locationWrap}>
          <TextInput
            style={styles.input}
            placeholder="City or location..."
            placeholderTextColor={C.textMuted}
            value={locationText}
            onChangeText={setLocationText}
            onSubmitEditing={handleCalculate}
            returnKeyType="search"
          />
        </GlassPanel>
        <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
          <GlassPanel style={styles.dateWrap}>
            <Text style={styles.dateText}>{formatDate(date)}</Text>
            <Text style={styles.dateIcon}>📅</Text>
          </GlassPanel>
        </TouchableOpacity>
      </View>

      {datePickerVisible && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_e: unknown, d?: Date) => {
            setDatePickerVisible(false);
            if (d) setDate(d);
          }}
        />
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.calcBtn, geocoding && styles.calcBtnDisabled]}
        onPress={handleCalculate}
        disabled={geocoding}
      >
        {geocoding
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.calcBtnText}>Calculate Sun Schedule</Text>}
      </TouchableOpacity>

      {/* Results */}
      {schedule && (
        <>
          <GlassPanel style={styles.resultHeader}>
            <View style={styles.resultHeaderInner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultLocation} numberOfLines={1}>📍 {locationName}</Text>
                <Text style={styles.resultDate}>{formatDate(date)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, saved && styles.saveBtnDone]}
                onPress={handleSaveLocation}
                disabled={saving || saved}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>{saved ? '✓ Saved' : '＋ Save'}</Text>}
              </TouchableOpacity>
            </View>
          </GlassPanel>

          {schedule.map((event, i) => (
            <GlassPanel key={i} style={isKeyEvent(event.label) ? { ...styles.eventCard, ...styles.eventCardKey } : styles.eventCard}>
              <View style={styles.eventRow}>
                <Text style={styles.eventEmoji}>{event.emoji}</Text>
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventLabel, isKeyEvent(event.label) && styles.eventLabelKey]}>
                    {event.label}
                  </Text>
                  {event.note ? <Text style={styles.eventNote}>{event.note}</Text> : null}
                </View>
                <Text style={[styles.eventTime, isKeyEvent(event.label) && styles.eventTimeKey]}>
                  {event.time ? fmt(event.time) : '—'}
                </Text>
              </View>
            </GlassPanel>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  container: { paddingHorizontal: 14 },

  header: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  back: { color: C.accent, fontSize: Math.round(14 * C.textScale), marginBottom: 4 },
  heading: { fontSize: Math.round(20 * C.textScale), fontWeight: '800', color: C.text, marginBottom: 1 },
  subheading: { fontSize: Math.round(12 * C.textScale), color: C.textMuted },

  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  locationWrap: { flex: 1, borderRadius: 12 },
  input: { paddingHorizontal: 12, paddingVertical: 11, fontSize: Math.round(14 * C.textScale), color: C.text },
  dateWrap: { borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 11 },
  dateText: { fontSize: Math.round(13 * C.textScale), color: C.text, marginRight: 6 },
  dateIcon: { fontSize: Math.round(14 * C.textScale) },

  errorText: { color: '#FF3B30', fontSize: Math.round(12 * C.textScale), marginBottom: 6, marginLeft: 2 },

  calcBtn: { backgroundColor: C.accent, paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  calcBtnDisabled: { opacity: 0.6 },
  calcBtnText: { color: '#fff', fontSize: Math.round(15 * C.textScale), fontWeight: '700' },

  resultHeader: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6 },
  resultHeaderInner: { flexDirection: 'row', alignItems: 'center' },
  resultLocation: { fontSize: Math.round(13 * C.textScale), fontWeight: '600', color: C.text },
  resultDate: { fontSize: Math.round(11 * C.textScale), color: C.textMuted, marginTop: 1 },
  saveBtn: { backgroundColor: C.accent, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, marginLeft: 8 },
  saveBtnDone: { backgroundColor: '#34C759' },
  saveBtnText: { color: '#fff', fontSize: Math.round(12 * C.textScale), fontWeight: '700' },

  eventCard: { borderRadius: 10, marginBottom: 4, paddingHorizontal: 12, paddingVertical: 8 },
  eventCardKey: { borderWidth: 1.5, borderColor: C.accent },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventEmoji: { fontSize: Math.round(17 * C.textScale), marginRight: 10, width: 24, textAlign: 'center' },
  eventInfo: { flex: 1 },
  eventLabel: { fontSize: Math.round(13 * C.textScale), color: C.textSub, fontWeight: '500' },
  eventLabelKey: { color: C.text, fontWeight: '700' },
  eventNote: { fontSize: Math.round(10 * C.textScale), color: C.textMuted, marginTop: 1 },
  eventTime: { fontSize: Math.round(13 * C.textScale), color: C.textSub, fontWeight: '500' },
  eventTimeKey: { fontSize: Math.round(13 * C.textScale), color: C.text, fontWeight: '700' },
});
