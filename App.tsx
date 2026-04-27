/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './MainNavigator';
import { BackgroundProvider } from './lib/backgroundContext';
import { ThemeProvider } from './lib/themeContext';

const BG = '#f2f2f2';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // Firebase not configured until GoogleService-Info.plist is added
    // registerPushToken();
  }, []);
  return (
    <ThemeProvider>
    <BackgroundProvider>
      <SafeAreaProvider>
        {/* Fill entire screen including unsafe areas (home indicator zone) with grey */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]} />
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={BG} />
        <View style={styles.root}>
          <MainNavigator />
        </View>
      </SafeAreaProvider>
    </BackgroundProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
});

export default App;
