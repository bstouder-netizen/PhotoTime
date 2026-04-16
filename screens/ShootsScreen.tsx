import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ShootsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shoots</Text>
      {/* Add Shoots screen content here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f2f2' },
  title: { fontSize: 24, fontWeight: 'bold' },
});
