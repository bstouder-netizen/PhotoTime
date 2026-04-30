import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';
import { supabase } from '../lib/supabase';

export default function ShootsScreen({ navigation }: any) {
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
        <Text style={styles.heading}>Shoots</Text>
      </GlassPanel>
      <View style={styles.body}>
        <TouchableOpacity onPress={() => navigation.navigate('PostJob')}>
          <GlassPanel style={styles.actionCard}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>Post a Job</Text>
            <Text style={styles.actionSub}>Share a photography opportunity</Text>
          </GlassPanel>
        </TouchableOpacity>
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
  header: { borderRadius: 18, marginBottom: 10, paddingHorizontal: 16, paddingVertical: 8 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },
  body: { flex: 1, justifyContent: 'center', gap: 14 },
  actionCard: { borderRadius: 22, paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center' },
  actionIcon: { fontSize: Math.round(40 * C.textScale), marginBottom: 12 },
  actionTitle: { fontSize: Math.round(20 * C.textScale), fontWeight: '700', color: C.text, marginBottom: 6 },
  actionSub: { fontSize: Math.round(14 * C.textScale), color: C.textSub },
});
