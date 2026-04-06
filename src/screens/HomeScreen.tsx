import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getTrips } from '../api/driverApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  const fetchTrips = async () => {
    const data = await getTrips();
    setTrips(data.bookings || data.trips || []);
  };

  const activeTrips = trips.filter(
    (t) =>
      t.status === 'ONGOING' ||
      t.status === 'CONFIRMED' ||
      t.status === 'ACCEPTED'
  );

  const completeTrip = async (id: string) => {
    console.log('Trip ID:', id);
    try {
      setLoadingId(id);
      const token = await AsyncStorage.getItem('auth-token');

      const res = await fetch(`https://drivemate.api.luisant.cloud/api/trips/${id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        Alert.alert('Success', 'Trip completed successfully!');
        fetchTrips(); // Refresh the list to remove the completed trip
      } else {
        Alert.alert('Error', data.error || data.message || 'Failed to complete trip');
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoadingId(null);
    }
  };

  const handleCompletePress = (trip: any) => {
    Alert.alert(
      'Complete Trip',
      `Mark this trip as completed?\n\nFrom: ${trip.pickupLocation}\nTo: ${trip.dropLocation}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => completeTrip(trip.id) },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Ongoing Trips</Text>

      {activeTrips.length === 0 ? (
        <View style={styles.emptyBox}>

          {/* Icon */}
          <Text style={styles.emptyIcon}>📋</Text>

          {/* Title */}
          <Text style={styles.emptyTitle}>No active trips</Text>

          {/* Subtitle */}
          <Text style={styles.emptySub}>
            Wait for admin to assign bookings
          </Text>

        </View>
      ) : (
        activeTrips.map((trip) => (
          <View key={trip.id} style={styles.card}>

            {/* Header Row */}
            <View style={styles.topRow}>
              <Text style={styles.onTrip}>
                {trip.status === 'CONFIRMED' ? 'On Trip' : trip.status || 'ONGOING'}
              </Text>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {trip.serviceType || 'Outstation'}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* FROM */}
            <Text style={styles.label}>FROM</Text>
            <Text style={styles.location}>{trip.pickupLocation}</Text>

            {/* TO */}
            <Text style={styles.label}>TO</Text>
            <Text style={styles.location}>{trip.dropLocation}</Text>

            {/* Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleCompletePress(trip)}
              disabled={loadingId === trip.id}
            >
              {loadingId === trip.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Complete Trip</Text>
              )}
            </TouchableOpacity>

          </View>
        ))
      )}
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 15,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 15,
  },

  empty: {
    textAlign: 'center',
    marginTop: 30,
    color: '#777',
  },

  card: {
    backgroundColor: '#000',
    borderRadius: 14,
    padding: 16,
    marginBottom: 15,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  onTrip: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  badge: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 10,
  },

  label: {
    color: '#888',
    fontSize: 11,
    marginTop: 8,
  },

  location: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },

  button: {
    backgroundColor: '#22c55e',
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyBox: {
    backgroundColor: '#f3f3f3',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 5,
  },

  emptySub: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
  },
});