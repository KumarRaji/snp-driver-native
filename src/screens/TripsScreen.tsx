import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { getTrips } from '../api/driverApi';

const TripsScreen = () => {
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    const data = await getTrips();

    const sortedTrips = (data.trips || []).sort((a: any, b: any) => {
      const getPriority = (status: string) => {
        if (status === 'CONFIRMED') return 1;
        if (status === 'COMPLETED') return 3;
        return 2; // Other statuses in the middle
      };
      
      const priorityDiff = getPriority(a.status) - getPriority(b.status);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // If same status, sort by date & time (newest top, oldest bottom)
      const timeA = new Date(`${a.startDate || '1970-01-01'}T${a.startTime || '00:00'}:00`).getTime();
      const timeB = new Date(`${b.startDate || '1970-01-01'}T${b.startTime || '00:00'}:00`).getTime();
      
      return timeB - timeA;
    });

    setTrips(sortedTrips);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#2ecc71';
      case 'COMPLETED':
        return '#3498db';
      case 'CANCELLED':
        return '#e74c3c';
      default:
        return '#999';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <Text style={styles.header}>Upcoming & Ongoing Trips</Text>

      {trips.map((trip) => (
        <View key={trip.id} style={styles.card}>

          {/* Status Badge */}
          <View style={styles.topRow}>
            <View style={styles.dot} />
            <Text style={[styles.status, { color: getStatusColor(trip.status) }]}>
              {trip.status}
            </Text>
          </View>

          {/* Pickup */}
          <Text style={styles.label}>PICKUP</Text>
          <Text style={styles.location}>{trip.pickupLocation}</Text>

          {/* Drop */}
          <Text style={styles.label}>DROP</Text>
          <Text style={styles.location}>{trip.dropLocation}</Text>

          {/* Date */}
          <Text style={styles.label}>DATE & TIME</Text>
          <Text style={styles.value}>
            {trip.startDate || 'N/A'} at {trip.startTime || 'N/A'}
          </Text>

          {/* Earnings */}
          <Text style={styles.label}>EST. EARNINGS</Text>
          <Text style={styles.earnings}>₹{trip.estimateAmount || 0}</Text>

        </View>
      ))}
    </ScrollView>
  );
};

export default TripsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 15,
  },

  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,

    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },

    // Android
    elevation: 3,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dot: {
    width: 14,
    height: 6,
    backgroundColor: '#000',
    borderRadius: 3,
  },

  status: {
    fontWeight: 'bold',
    fontSize: 13,
  },

  label: {
    fontSize: 11,
    color: '#888',
    marginTop: 10,
  },

  location: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },

  value: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: 'bold',
  },

  earnings: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
});