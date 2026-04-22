import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ShootsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shoots</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={() => {}}>
          <Text style={styles.buttonText}>Post a Job</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => {}}>
          <Text style={[styles.buttonText, styles.buttonOutlineText]}>Job Openings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f2f2' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32 },
  buttonRow: { flexDirection: 'row', gap: 16 },
  button: {
    backgroundColor: '#2196f3',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  buttonOutlineText: { color: '#2196f3' },
});
