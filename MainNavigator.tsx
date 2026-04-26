import React, { useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GlassBg } from './components/Glass';

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    card: 'transparent',
  },
};
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import LocationsScreen from './screens/LocationsScreen';
import ShootsScreen from './screens/ShootsScreen';
import PostJobScreen from './screens/PostJobScreen';
import JobOpeningsScreen from './screens/JobOpeningsScreen';
import SearchScreen from './screens/SearchScreen';
import PortfolioScreen from './screens/PortfolioScreen';
import ComingSoonScreen from './screens/ComingSoonScreen';
import SunsetCalculatorScreen from './screens/SunsetCalculatorScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ShootsStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Profile" component={ProfileScreen} />
      <HomeStack.Screen name="ComingSoon" component={ComingSoonScreen} />
      <HomeStack.Screen name="SunsetCalculator" component={SunsetCalculatorScreen} />
    </HomeStack.Navigator>
  );
}

function ShootsStackScreen() {
  return (
    <ShootsStack.Navigator screenOptions={{ headerShown: false }}>
      <ShootsStack.Screen name="ShootsMain" component={ShootsScreen} />
      <ShootsStack.Screen name="PostJob" component={PostJobScreen} />
      <ShootsStack.Screen name="JobOpenings" component={JobOpeningsScreen} />
    </ShootsStack.Navigator>
  );
}

const ACTIVE_COLOR = '#1C1C1E';
const INACTIVE_COLOR = '#FFFFFF';
const ICON_SIZE = 26;
const CIRCLE_SIZE = 44;

const TAB_LABELS: Record<string, string> = {
  Home: 'Home',
  Locations: 'Locations',
  Shoots: 'Shoots',
  Search: 'Photography Stuff',
  Portfolio: 'Portfolio',
};

function TooltipButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
        setVisible(false),
      );
    }, 1500);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={showTooltip}
      activeOpacity={0.7}
      style={styles.buttonWrapper}
    >
      {visible && (
        <Animated.View style={[styles.tooltip, { opacity }]}>
          <Text style={styles.tooltipText}>{label}</Text>
        </Animated.View>
      )}
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 16,
    flex: 1,
  },
  tooltip: {
    position: 'absolute',
    bottom: CIRCLE_SIZE + 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 100,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

function PortfolioTabIcon({ focused }: { focused: boolean }) {
  const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <View
      style={{
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialIcons name="person-outline" size={ICON_SIZE} color={color} />
    </View>
  );
}

function SearchTabIcon({ focused }: { focused: boolean }) {
  const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <View
      style={{
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons name="camera-outline" size={ICON_SIZE} color={color} />
    </View>
  );
}

function ShootsTabIcon({ focused }: { focused: boolean }) {
  const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <View
      style={{
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons name="weather-sunset" size={ICON_SIZE} color={color} />
    </View>
  );
}

function LocationTabIcon({ focused }: { focused: boolean }) {
  const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <View
      style={{
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons name="map-marker-radius" size={ICON_SIZE} color={color} />
    </View>
  );
}

function HomeTabIcon({ focused }: { focused: boolean }) {
  return (
    <View
      style={{
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: focused ? ACTIVE_COLOR : INACTIVE_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons
        name="home"
        size={ICON_SIZE}
        color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
      />
    </View>
  );
}

export default function MainNavigator() {
  return (
    <GlassBg>
      <NavigationContainer theme={AppTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarShowLabel: false,
            headerShown: false,
            tabBarStyle: {
              height: 90,
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
              position: 'absolute',
            },
            tabBarItemStyle: {
              width: 70,
            },
          tabBarButton: (props) => (
            <TooltipButton
              label={TAB_LABELS[route.name] ?? route.name}
              onPress={props.onPress as () => void}
            >
              {props.children}
            </TooltipButton>
          ),
          tabBarIcon: ({ focused }) => {
            switch (route.name) {
              case 'Home':
                return <HomeTabIcon focused={focused} />;
              case 'Locations':
                return <LocationTabIcon focused={focused} />;
              case 'Search':
                return <SearchTabIcon focused={focused} />;
              case 'Shoots':
                return <ShootsTabIcon focused={focused} />;
              case 'Portfolio':
                return <PortfolioTabIcon focused={focused} />;
              default:
                return null;
            }
          },
          tabBarActiveTintColor: ACTIVE_COLOR,
          tabBarInactiveTintColor: INACTIVE_COLOR,
        })}
      >
        <Tab.Screen name="Home" component={HomeStackScreen} />
        <Tab.Screen name="Locations" component={LocationsScreen} />
        <Tab.Screen name="Shoots" component={ShootsStackScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Portfolio" component={PortfolioScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </GlassBg>
  );
}
