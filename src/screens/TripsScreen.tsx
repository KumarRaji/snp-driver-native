import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { getTrips } from '../api/driverApi';

const TripsScreen = () => {
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    const data = await getTrips();
    setTrips(data.trips || []);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Trip History</Text>

      {trips.map((trip) => (
        <View key={trip.id} style={styles.card}>
          <Text>{trip.pickupLocation}</Text>
          <Text>↓</Text>
          <Text>{trip.dropLocation}</Text>
          <Text>Status: {trip.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default TripsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  title: { fontSize: 20, fontWeight: 'bold' },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
  },
});