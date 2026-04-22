import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: insets.top }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.userName}>User Name</Text>
          <View style={styles.picCircle}>
            <Text style={styles.picLabel}>PIC</Text>
          </View>
        </View>

        {/* Photographers Near You */}
        <View style={styles.sectionBanner}>
          <Text style={styles.sectionBannerText}>PHOTOGRAPHERS NEAR YOU</Text>
        </View>

        {/* Featured Photographer */}
        <View style={styles.featuredCard}>
          <Image
            source={require('../assets/photographer_of_month.png')}
            style={styles.featuredImage}
            resizeMode="contain"
          />
          <Text style={styles.featuredLabel}>FEATURED PHOTOGRAPHER</Text>
        </View>

        {/* Job Referral + New Scouted Location */}
        <View style={styles.row}>
          <View style={[styles.halfCard, styles.halfCardLeft]}>
            <Image source={require('../assets/job_referral.png')} style={styles.halfImage} resizeMode="contain" />
            <Text style={styles.halfLabel}>JOB REFERRAL</Text>
          </View>
          <View style={[styles.halfCard, styles.halfCardRight]}>
            <Image source={require('../assets/scouted_location.png')} style={styles.halfImage} resizeMode="contain" />
            <Text style={styles.halfLabel}>NEW SCOUTED LOCATION</Text>
          </View>
        </View>
      </ScrollView>

      {/* STORE / LEARN / SHARE — in flow, sits above tab bar */}
      <View style={[styles.actionBar, { marginBottom: 24 }]}>
        <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
          <Image source={require('../assets/store.png')} style={styles.actionIcon} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
          <Image source={require('../assets/learn.png')} style={styles.actionIcon} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
          <Image source={require('../assets/share_app.png')} style={styles.actionIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingBottom: 16,
    backgroundColor: '#f2f2f2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  picCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  picLabel: {
    fontSize: 11,
    color: '#555',
    fontWeight: '500',
  },
  sectionBanner: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionBannerText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#333',
  },
  featuredCard: {
    backgroundColor: '#e0e0e0',
    margin: 12,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  featuredImage: {
    width: 180,
    height: 180,
  },
  featuredLabel: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: 12,
    gap: 12,
  },
  halfCard: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  halfCardLeft: {
    backgroundColor: '#fef9e7',
  },
  halfCardRight: {
    backgroundColor: '#eafaf1',
  },
  halfImage: {
    width: 110,
    height: 110,
  },
  halfLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#333',
    textAlign: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    marginHorizontal: 8,
    gap: 4,
    height: 110,
  },
  actionButton: {
    flex: 1,
  },
  actionIcon: {
    width: '100%',
    height: '100%',
  },
});
