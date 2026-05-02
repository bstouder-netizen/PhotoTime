import { useEffect } from 'react';
import { Alert, LogBox, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';

LogBox.ignoreLogs([
  'Push token registration failed',
  'Push foreground listener failed',
  'No Firebase App',
  'firebase',
  'Unable to find',
  'Possible Unhandled Promise Rejection',
]);
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './MainNavigator';
import { BackgroundProvider } from './lib/backgroundContext';
import { ThemeProvider } from './lib/themeContext';
import { registerPushToken, onForegroundMessage } from './lib/notifications';

const BG = '#f2f2f2';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    registerPushToken();
    const unsubscribe = onForegroundMessage((title, body) => {
      Alert.alert(title, body);
    });
    return unsubscribe;
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
