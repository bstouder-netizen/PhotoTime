import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';

export default function AboutScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassPanel style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>About</Text>
      </GlassPanel>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <GlassPanel style={styles.card}>
          <Text style={styles.title}>PHOTO TIME</Text>
          <Text style={styles.bio}>
            Built by photographers, for photographers, our app is a home for the photography community—where creators can connect, collaborate, and inspire each other.{'\n\n'}
            Discover and share great shoot locations (from hidden gems to classic spots), trade real-world tips and tricks, and learn what's working from people who actually shoot.{'\n\n'}
            And because photography should be fun, we also drop community-made swag you'll actually want to wear and use.{'\n\n'}
            Whether you're just starting out or you've been behind the lens for years, this is the place to find your people, level up your craft, and get out shooting more.
          </Text>
        </GlassPanel>
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  header: { borderRadius: 18, marginBottom: 10, paddingHorizontal: 16, paddingVertical: 8 },
  back: { color: C.accent, fontSize: Math.round(15 * C.textScale), marginBottom: 4 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },

  content: { paddingBottom: 60 },
  card: { borderRadius: 22, padding: 24 },
  title: {
    fontSize: Math.round(28 * C.textScale),
    fontWeight: '800',
    color: C.text,
    letterSpacing: 2,
    marginBottom: 20,
    textAlign: 'center',
  },
  bio: {
    fontSize: Math.round(15 * C.textScale),
    color: C.textSub,
    lineHeight: Math.round(24 * C.textScale),
  },
});
