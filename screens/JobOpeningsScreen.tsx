import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity,
  RefreshControl, Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';
import { GlassPanel, GLASS } from '../components/Glass';

type Job = {
  id: string; title: string; description: string; location: string;
  pay: string; type: string; posted_by: string; created_at: string;
  job_date?: string; device_id?: string;
};

const JOB_TYPES = [
  'Wedding', 'Portrait', 'Headshot', 'Family', 'Event', 'Corporate',
  'Product', 'Fashion', 'Real Estate', 'Food', 'Sports', 'Music',
  'Travel', 'Landscape', 'Wildlife', 'Branding', 'Commercial',
  'Documentary', 'Pet', 'Drone',
];

export default function JobOpeningsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState('');

  // Edit modal state
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPay, setEditPay] = useState('');
  const [editType, setEditType] = useState('');
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => { getDeviceId().then(setDeviceId); }, []);

  const cleanupExpiredJobs = async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    await supabase
      .from('job_postings')
      .delete()
      .lt('job_date', cutoff.toISOString().split('T')[0])
      .not('job_date', 'is', null);
  };

  const fetchJobs = async () => {
    await cleanupExpiredJobs();
    const { data, error } = await supabase
      .from('job_postings')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setJobs(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const openEdit = (job: Job) => {
    setEditJob(job);
    setEditTitle(job.title);
    setEditDescription(job.description);
    setEditLocation(job.location || '');
    setEditPay(job.pay || '');
    setEditType(job.type || '');
    setEditDate(job.job_date ? new Date(job.job_date + 'T12:00:00') : null);
  };

  const handleSaveEdit = async () => {
    if (!editJob) return;
    if (!editTitle.trim() || !editDescription.trim()) {
      Alert.alert('Required', 'Title and description are required.');
      return;
    }
    setEditLoading(true);
    const { error } = await supabase
      .from('job_postings')
      .update({
        title: editTitle,
        description: editDescription,
        location: editLocation,
        pay: editPay,
        type: editType,
        job_date: editDate ? editDate.toISOString().split('T')[0] : null,
      })
      .eq('id', editJob.id);
    setEditLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setEditJob(null);
    fetchJobs();
  };

  const handleDelete = () => {
    if (!editJob) return;
    Alert.alert('Delete Job', 'Are you sure you want to delete this posting?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('job_postings').delete().eq('id', editJob.id);
          setEditJob(null);
          fetchJobs();
        },
      },
    ]);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={GLASS.accent} /></View>;
  }

  return (
    <>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <GlassPanel style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Job Openings</Text>
        </GlassPanel>

        <FlatList
          data={jobs}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchJobs(); }}
              tintColor={GLASS.accent}
            />
          }
          ListEmptyComponent={
            <GlassPanel style={styles.emptyCard}>
              <Text style={styles.emptyText}>No job openings yet.</Text>
            </GlassPanel>
          }
          renderItem={({ item }) => {
            const expanded = expandedId === item.id;
            const isOwner = !!deviceId && item.device_id === deviceId;
            return (
              <GlassPanel style={styles.card}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setExpandedId(expanded ? null : item.id)}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleBlock}>
                      <View style={styles.titleRow}>
                        <Text style={styles.title}>{item.title}</Text>
                        {item.type ? <Text style={styles.typeTag}>{item.type}</Text> : null}
                      </View>
                      {item.posted_by ? <Text style={styles.postedBy}>@{item.posted_by}</Text> : null}
                    </View>
                    <View style={styles.cardHeaderRight}>
                      {isOwner && (
                        <TouchableOpacity onPress={() => openEdit(item)} style={styles.editButton}>
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                      )}
                      <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    {[item.location, item.job_date, item.pay]
                      .filter(Boolean)
                      .map((val, i) => (
                        <React.Fragment key={i}>
                          {i > 0 ? <Text style={styles.metaDot}>·</Text> : null}
                          <Text style={styles.metaChip}>{val}</Text>
                        </React.Fragment>
                      ))}
                  </View>
                  {expanded ? (
                    <>
                      <View style={styles.divider} />
                      <Text style={styles.descriptionFull}>{item.description}</Text>
                    </>
                  ) : null}
                </TouchableOpacity>
              </GlassPanel>
            );
          }}
        />
      </View>

      {/* Edit Modal */}
      <Modal visible={!!editJob} transparent animationType="slide">
        <View style={styles.editOverlay}>
          <GlassPanel style={styles.editSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Job</Text>
              <TouchableOpacity onPress={() => setEditJob(null)}>
                <Text style={styles.sheetCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            >
              <Text style={styles.label}>Job Title *</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle}
                  placeholderTextColor={GLASS.textMuted} placeholder="Job title" />
              </GlassPanel>

              <Text style={styles.label}>Job Type</Text>
              <TouchableOpacity onPress={() => setTypePickerVisible(true)}>
                <GlassPanel style={styles.picker}>
                  <Text style={editType ? styles.pickerValue : styles.pickerPlaceholder}>
                    {editType || 'Select a type...'}
                  </Text>
                  <Text style={styles.pickerChevron}>▾</Text>
                </GlassPanel>
              </TouchableOpacity>

              <Text style={styles.label}>Job Date</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
                <GlassPanel style={styles.picker}>
                  <Text style={editDate ? styles.pickerValue : styles.pickerPlaceholder}>
                    {editDate ? formatDate(editDate) : 'Select a date...'}
                  </Text>
                  <Text style={styles.pickerChevron}>📅</Text>
                </GlassPanel>
              </TouchableOpacity>

              <Text style={styles.label}>Description *</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={[styles.input, styles.textArea]} value={editDescription}
                  onChangeText={setEditDescription} placeholderTextColor={GLASS.textMuted}
                  placeholder="Job description" multiline numberOfLines={5} />
              </GlassPanel>

              <Text style={styles.label}>Location</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={styles.input} value={editLocation} onChangeText={setEditLocation}
                  placeholderTextColor={GLASS.textMuted} placeholder="e.g. Los Angeles, CA" />
              </GlassPanel>

              <Text style={styles.label}>Pay</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={styles.input} value={editPay} onChangeText={setEditPay}
                  placeholderTextColor={GLASS.textMuted} placeholder="e.g. $500 / day" />
              </GlassPanel>

              <TouchableOpacity
                style={[styles.saveButton, editLoading && styles.buttonDisabled]}
                onPress={handleSaveEdit}
                disabled={editLoading}
              >
                {editLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveButtonText}>Save Changes</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Delete Job Posting</Text>
              </TouchableOpacity>
            </ScrollView>
          </GlassPanel>
        </View>
      </Modal>

      {/* Date Picker */}
      <Modal visible={datePickerVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setDatePickerVisible(false)} />
        <GlassPanel style={styles.pickerSheet}>
          <View style={{ paddingBottom: insets.bottom + 8 }}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Text style={styles.sheetCancel}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={editDate ?? new Date()}
              mode="date"
              display="spinner"
              onChange={(_event: unknown, date?: Date) => { if (date) setEditDate(date); }}
            />
          </View>
        </GlassPanel>
      </Modal>

      {/* Type Picker */}
      <Modal visible={typePickerVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setTypePickerVisible(false)} />
        <GlassPanel style={styles.pickerSheet}>
          <View style={{ paddingBottom: insets.bottom + 8 }}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Job Type</Text>
              <TouchableOpacity onPress={() => setTypePickerVisible(false)}>
                <Text style={styles.sheetCancel}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={JOB_TYPES}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.typeRow}
                  onPress={() => { setEditType(item); setTypePickerVisible(false); }}
                >
                  <Text style={[styles.typeText, item === editType && styles.typeSelected]}>{item}</Text>
                  {item === editType && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </GlassPanel>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { borderRadius: 18, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14 },
  back: { color: GLASS.accent, fontSize: 15, marginBottom: 4 },
  heading: { fontSize: 22, fontWeight: '700', color: GLASS.text },
  list: { paddingBottom: 32, gap: 10 },
  card: { borderRadius: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2, padding: 16, paddingBottom: 0 },
  cardTitleBlock: { flex: 1, marginRight: 8 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 16, fontWeight: '700', color: GLASS.text, marginBottom: 2 },
  postedBy: { fontSize: 12, color: GLASS.textMuted, marginBottom: 6 },
  editButton: { backgroundColor: GLASS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  editButtonText: { fontSize: 12, fontWeight: '600', color: GLASS.accent },
  chevron: { fontSize: 12, color: GLASS.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: GLASS.border, marginVertical: 10, marginHorizontal: 16 },
  descriptionFull: { fontSize: 14, color: GLASS.textSub, lineHeight: 21, paddingHorizontal: 16, paddingBottom: 16 },
  emptyCard: { borderRadius: 20, alignItems: 'center', padding: 40, marginTop: 40 },
  emptyText: { color: GLASS.textSub, fontSize: 16 },

  // Edit modal
  editOverlay: { flex: 1, justifyContent: 'flex-end' },
  editSheet: { borderRadius: 24, marginHorizontal: 0, maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: GLASS.border },
  sheetTitle: { fontSize: 17, fontWeight: '600', color: GLASS.text },
  sheetCancel: { color: GLASS.accent, fontSize: 16, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: GLASS.textSub, marginBottom: 6, marginTop: 14, marginHorizontal: 20 },
  inputWrap: { borderRadius: 14, marginHorizontal: 16 },
  input: { paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: GLASS.text },
  textArea: { height: 110, textAlignVertical: 'top' },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginHorizontal: 16 },
  pickerValue: { fontSize: 15, color: GLASS.text, flex: 1 },
  pickerPlaceholder: { fontSize: 15, color: GLASS.textMuted, flex: 1 },
  pickerChevron: { fontSize: 16, color: GLASS.textSub },
  saveButton: { backgroundColor: GLASS.accent, paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 24, marginHorizontal: 16 },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteButton: { alignItems: 'center', marginTop: 12, paddingVertical: 10, marginBottom: 4 },
  deleteButtonText: { color: '#FF3B30', fontSize: 15, fontWeight: '600' },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  typeTag: { fontSize: 11, fontWeight: '700', color: GLASS.accent, textTransform: 'uppercase', letterSpacing: 0.7, backgroundColor: GLASS.border, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },

  // Card facts
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingHorizontal: 16, paddingBottom: 12, gap: 4 },
  metaDot: { fontSize: 12, color: GLASS.textMuted, marginHorizontal: 2 },
  metaChip: { fontSize: 13, color: GLASS.textSub },

  // Sub-pickers
  modalOverlay: { flex: 1 },
  pickerSheet: { borderRadius: 24, marginHorizontal: 12, marginBottom: 12, maxHeight: '55%' },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: GLASS.border },
  typeText: { fontSize: 16, color: GLASS.textSub },
  typeSelected: { color: GLASS.text, fontWeight: '600' },
  checkmark: { color: GLASS.accent, fontSize: 16, fontWeight: '700' },
});
