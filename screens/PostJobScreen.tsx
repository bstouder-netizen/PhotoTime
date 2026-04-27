import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal, FlatList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';

const JOB_TYPES = [
  'Wedding', 'Portrait', 'Headshot', 'Family', 'Event', 'Corporate',
  'Product', 'Fashion', 'Real Estate', 'Food', 'Sports', 'Music',
  'Travel', 'Landscape', 'Wildlife', 'Branding', 'Commercial',
  'Documentary', 'Pet', 'Drone',
];

export default function PostJobScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [pay, setPay] = useState('');
  const [jobType, setJobType] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [jobDate, setJobDate] = useState<Date | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [postedBy, setPostedBy] = useState('');

  useEffect(() => {
    (async () => {
      const id = await getDeviceId();
      setDeviceId(id);
      const { data } = await supabase.from('profiles').select('username').eq('device_id', id).single();
      if (data?.username) setPostedBy(data.username);
    })();
  }, []);

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) { Alert.alert('Required', 'Title and description are required.'); return; }
    setLoading(true);
    const { error } = await supabase.from('job_postings').insert([{
      title, description, location: location.trim() || null, pay, type: jobType,
      job_date: jobDate?.toISOString().split('T')[0] ?? null,
      device_id: deviceId,
      posted_by: postedBy,
    }]);
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); }
    else { Alert.alert('Posted!', 'Your job has been posted.', [{ text: 'OK', onPress: () => navigation.goBack() }]); }
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Post a Job</Text>
        {postedBy ? <Text style={styles.postedAs}>Posting as @{postedBy}</Text> : null}

        <Text style={styles.label}>Job Title *</Text>
        <GlassPanel style={styles.inputWrap}>
          <TextInput style={styles.input} placeholder="e.g. Wedding Photographer Needed"
            placeholderTextColor={C.textMuted} value={title} onChangeText={setTitle} />
        </GlassPanel>

        <Text style={styles.label}>Job Type</Text>
        <TouchableOpacity onPress={() => setPickerVisible(true)}>
          <GlassPanel style={styles.picker}>
            <Text style={jobType ? styles.pickerValue : styles.pickerPlaceholder}>{jobType || 'Select a type...'}</Text>
            <Text style={styles.pickerChevron}>▾</Text>
          </GlassPanel>
        </TouchableOpacity>

        <Text style={styles.label}>Job Date</Text>
        <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
          <GlassPanel style={styles.picker}>
            <Text style={jobDate ? styles.pickerValue : styles.pickerPlaceholder}>{jobDate ? formatDate(jobDate) : 'Select a date...'}</Text>
            <Text style={styles.pickerChevron}>📅</Text>
          </GlassPanel>
        </TouchableOpacity>

        <Text style={styles.label}>Description *</Text>
        <GlassPanel style={styles.inputWrap}>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Describe the job, requirements, dates..."
            placeholderTextColor={C.textMuted} value={description} onChangeText={setDescription} multiline numberOfLines={5} />
        </GlassPanel>

        <Text style={styles.label}>Location</Text>
        <GlassPanel style={styles.inputWrap}>
          <TextInput style={styles.input} placeholder="e.g. Los Angeles, CA"
            placeholderTextColor={C.textMuted} value={location} onChangeText={setLocation} />
        </GlassPanel>

        <Text style={styles.label}>Pay</Text>
        <GlassPanel style={styles.inputWrap}>
          <TextInput style={styles.input} placeholder="e.g. $500 / day"
            placeholderTextColor={C.textMuted} value={pay} onChangeText={setPay} />
        </GlassPanel>

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Post Job</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={datePickerVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setDatePickerVisible(false)} />
        <GlassPanel style={styles.modalSheet}>
          <View style={{ paddingBottom: insets.bottom + 8 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}><Text style={styles.modalDone}>Done</Text></TouchableOpacity>
            </View>
            <DateTimePicker value={jobDate ?? new Date()} mode="date" display="spinner" minimumDate={new Date()}
              onChange={(_event: unknown, date?: Date) => { if (date) setJobDate(date); }} />
          </View>
        </GlassPanel>
      </Modal>

      <Modal visible={pickerVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setPickerVisible(false)} />
        <GlassPanel style={styles.modalSheet}>
          <View style={{ paddingBottom: insets.bottom + 8 }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Job Type</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)}><Text style={styles.modalDone}>Done</Text></TouchableOpacity>
          </View>
          <FlatList
            data={JOB_TYPES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.typeRow} onPress={() => { setJobType(item); setPickerVisible(false); }}>
                <Text style={[styles.typeText, item === jobType && styles.typeSelected]}>{item}</Text>
                {item === jobType && <Text style={styles.checkmark}>✓</Text>}
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
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  heading: { fontSize: Math.round(24 * C.textScale), fontWeight: '700', marginBottom: 4, color: C.text },
  postedAs: { fontSize: Math.round(13 * C.textScale), color: C.textMuted, marginBottom: 20 },
  label: { fontSize: Math.round(13 * C.textScale), fontWeight: '600', color: C.textSub, marginBottom: 6, marginTop: 14 },
  inputWrap: { borderRadius: 14 },
  input: { paddingHorizontal: 14, paddingVertical: 13, fontSize: Math.round(15 * C.textScale), color: C.text },
  textArea: { height: 120, textAlignVertical: 'top' },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14 },
  pickerValue: { fontSize: Math.round(15 * C.textScale), color: C.text, flex: 1 },
  pickerPlaceholder: { fontSize: Math.round(15 * C.textScale), color: C.textMuted, flex: 1 },
  pickerChevron: { fontSize: Math.round(16 * C.textScale), color: C.textSub },
  button: { backgroundColor: C.accent, paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 28 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: Math.round(16 * C.textScale), fontWeight: '700' },
  cancelButton: { alignItems: 'center', marginTop: 14, paddingVertical: 10 },
  cancelText: { color: C.textSub, fontSize: Math.round(15 * C.textScale) },
  modalOverlay: { flex: 1 },
  modalSheet: { borderRadius: 24, marginHorizontal: 12, marginBottom: 12, maxHeight: '55%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: Math.round(17 * C.textScale), fontWeight: '600', color: C.text },
  modalDone: { color: C.accent, fontSize: Math.round(16 * C.textScale), fontWeight: '600' },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  typeText: { fontSize: Math.round(16 * C.textScale), color: C.textSub },
  typeSelected: { color: C.text, fontWeight: '600' },
  checkmark: { color: C.accent, fontSize: Math.round(16 * C.textScale), fontWeight: '700' },
});
