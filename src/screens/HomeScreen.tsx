import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { getTrips } from '../api/driverApi';

const HomeScreen = () => {
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    const data = await getTrips();
    setTrips(data.trips || []);
  };

  const activeTrips = trips.filter(
    (t) =>
      t.status === 'ONGOING' ||
      t.status === 'CONFIRMED' ||
      t.status === 'ACCEPTED'
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ongoing Trips</Text>

      {activeTrips.length === 0 ? (
        <Text style={styles.empty}>No active trips</Text>
      ) : (
        activeTrips.map((trip) => (
          <View key={trip.id} style={styles.card}>
            <Text style={styles.location}>{trip.pickupLocation}</Text>
            <Text style={styles.arrow}>↓</Text>
            <Text style={styles.location}>{trip.dropLocation}</Text>
            <Text style={styles.price}>₹{trip.estimateAmount}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  empty: { textAlign: 'center', marginTop: 20 },
  card: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  location: { color: '#fff', fontWeight: 'bold' },
  arrow: { color: '#fff', textAlign: 'center' },
  price: { color: '#0f0', marginTop: 10 },
});