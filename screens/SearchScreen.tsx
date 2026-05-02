import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';
import { supabase } from '../lib/supabase';

export default function SearchScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [jobCount, setJobCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .then(({ count }) => setJobCount(count ?? 0));
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <Text style={styles.heading}>Jobs & Gigs</Text>
        <Text style={styles.subheading}>Find work and opportunities</Text>
      </GlassPanel>

      <View style={styles.body}>
        <TouchableOpacity onPress={() => navigation.navigate('JobOpenings')}>
          <GlassPanel style={styles.actionCard}>
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionTitle}>Job Openings</Text>
            <Text style={styles.actionSub}>
              {jobCount === null ? 'Browse available shoots' : `${jobCount} job${jobCount === 1 ? '' : 's'} available`}
            </Text>
          </GlassPanel>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  header: { borderRadius: 18, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 8 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },
  subheading: { fontSize: Math.round(13 * C.textScale), color: C.textMuted, marginTop: 2 },
  body: { flex: 1, justifyContent: 'center', gap: 14 },
  actionCard: { borderRadius: 22, paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center' },
  actionIcon: { fontSize: Math.round(40 * C.textScale), marginBottom: 12 },
  actionTitle: { fontSize: Math.round(20 * C.textScale), fontWeight: '700', color: C.text, marginBottom: 6 },
  actionSub: { fontSize: Math.round(14 * C.textScale), color: C.textSub },
});
