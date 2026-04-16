import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f2f2f2',
    card: '#f2f2f2',
  },
};
import HomeScreen from './screens/HomeScreen';
import LocationsScreen from './screens/LocationsScreen';
import ShootsScreen from './screens/ShootsScreen';
import SearchScreen from './screens/SearchScreen';
import PortfolioScreen from './screens/PortfolioScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator();

const ACTIVE_COLOR = '#2196f3';
const INACTIVE_COLOR = '#222';
const ICON_SIZE = 30;
const CIRCLE_SIZE = 52;


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
    <NavigationContainer theme={AppTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarShowLabel: false,
          headerShown: false,
          tabBarBackground: () => null,
          tabBarStyle: {
            height: 80,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
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
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Locations" component={LocationsScreen} />
        <Tab.Screen name="Shoots" component={ShootsScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
