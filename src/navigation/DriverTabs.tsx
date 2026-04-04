
import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';

import HomeScreen from '../screens/HomeScreen';
import RequestsScreen from '../screens/RequestsScreen';
import TripsScreen from '../screens/TripsScreen';
import PackagesScreen from '../screens/PackagesScreen';

const Tab = createMaterialTopTabNavigator();

export default function DriverTabs() {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <Tab.Navigator
        initialRouteName="REQUESTS"
        screenOptions={{
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.label,
          tabBarIndicatorStyle: styles.indicator,
        }}
      >
        <Tab.Screen name="REQUESTS" component={RequestsScreen} />
        <Tab.Screen name="HOME" component={HomeScreen} />
        <Tab.Screen name="TRIPS" component={TripsScreen} />
        <Tab.Screen name="PACKAGES" component={PackagesScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  tabBar: {
    backgroundColor: '#fff',
    paddingTop: 10,          // ✅ FIX: moves tabs down
    elevation: 4,
  },

  label: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  indicator: {
    backgroundColor: '#000',
  },
});