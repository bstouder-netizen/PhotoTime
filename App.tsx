/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './MainNavigator';

const BG = '#f2f2f2';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      {/* Fill entire screen including unsafe areas (home indicator zone) with grey */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]} />
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={BG} />
      <View style={styles.root}>
        <MainNavigator />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
});

export default App;
