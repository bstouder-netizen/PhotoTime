import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassPanel, GLASS } from '../components/Glass';

export default function ShootsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
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
            <Text style={styles.actionSub}>Browse available shoots</Text>
          </GlassPanel>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  header: { borderRadius: 18, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 14 },
  heading: { fontSize: 22, fontWeight: '700', color: GLASS.text },
  body: { flex: 1, justifyContent: 'center', gap: 14 },
  actionCard: {
    borderRadius: 22, paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center',
  },
  actionIcon: { fontSize: 40, marginBottom: 12 },
  actionTitle: { fontSize: 20, fontWeight: '700', color: GLASS.text, marginBottom: 6 },
  actionSub: { fontSize: 14, color: GLASS.textSub },
});
