import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { getTrips } from '../api/driverApi';

const HomeScreen = () => {
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    fetchTrips();
  }, []);

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Ongoing Trips</Text>

      {activeTrips.length === 0 ? (
        <Text style={styles.empty}>No active trips</Text>
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
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Complete Trip</Text>
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
});