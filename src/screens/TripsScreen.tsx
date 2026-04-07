import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { getTrips, handleLogoutIfRequired } from '../api/driverApi';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

const TripsScreen = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  const fetchTrips = async () => {
    try {
      const data = await getTrips();

      if (await handleLogoutIfRequired(data, navigation)) return;
  
      const sortedTrips = (data?.trips || []).sort((a: any, b: any) => {
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
    } catch (error) {
      console.error('Error fetching trips:', error);
      setTrips([]);
    }
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

  const upcomingTrips = trips.filter(
    (t) => t.status === 'CONFIRMED' || t.status === 'ONGOING'
  );

  const completedTrips = trips.filter(
    (t) => t.status === 'COMPLETED'
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 🔥 Upcoming Section */}
      <View style={styles.titleRow}>
        <View style={styles.greenDot} />
        <Text style={styles.header}>Upcoming & Ongoing Trips</Text>
      </View>

      {upcomingTrips.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No upcoming trips scheduled.</Text>
        </View>
      ) : (
        upcomingTrips.map((trip) => (
          <View key={trip.id} style={styles.card}>
            <View style={styles.topRow}>
              <View style={styles.dot} />
              <Text style={[styles.status, { color: getStatusColor(trip.status) }]}>
                {trip.status}
              </Text>
            </View>

            {/* Timeline & Locations */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={styles.outerDot}><View style={styles.innerDot} /></View>
                <View style={styles.line} />
                <Feather name="map-pin" size={14} color="#000" />
              </View>
              <View style={styles.timelineRight}>
                <Text style={styles.label}>PICKUP</Text>
                <Text style={styles.location}>{trip.pickupLocation}</Text>
                <Text style={[styles.label, { marginTop: 10 }]}>DROP</Text>
                <Text style={styles.location}>{trip.dropLocation}</Text>
              </View>
            </View>

            <Text style={[styles.label, { marginTop: 10 }]}>DATE & TIME</Text>
            <Text style={styles.value}>
              {trip.startDate || 'N/A'} at {trip.startTime || 'N/A'}
            </Text>

            <Text style={[styles.label, { marginTop: 10 }]}>EST. EARNINGS</Text>
            <Text style={styles.earnings}>₹{trip.estimateAmount || 0}</Text>
          </View>
        ))
      )}

      {/* 🔥 Completed Section */}
      <Text style={[styles.header, { marginTop: 20, marginBottom: 15 }]}>Completed Trips</Text>

      {completedTrips.length === 0 ? (
        <Text style={styles.emptySmall}>No completed trips yet.</Text>
      ) : (
        completedTrips.map((trip) => (
          <View key={trip.id} style={styles.card}>

            {/* Top Row */}
            <View style={styles.topRow}>
              <Text style={styles.date}>
                {trip.startDate} • {trip.startTime}
              </Text>

              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>Completed</Text>
              </View>
            </View>

            {/* Timeline & Locations */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={styles.outerDot}><View style={styles.innerDot} /></View>
                <View style={styles.line} />
                <Feather name="map-pin" size={14} color="#000" />
              </View>
              <View style={styles.timelineRight}>
                <Text style={styles.label}>FROM</Text>
                <Text style={styles.location}>{trip.pickupLocation}</Text>
                <Text style={[styles.label, { marginTop: 10 }]}>TO</Text>
                <Text style={styles.location}>{trip.dropLocation}</Text>
              </View>
            </View>

            {/* Bottom Row */}
            <View style={styles.bottomRow}>
              <View />

              <Text style={styles.amount}>
                ₹{trip.estimatedCost || trip.estimateAmount || 0}
              </Text>
            </View>

          </View>
        ))
      )}

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
    fontSize: 18,
    fontWeight: 'bold',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 8,
    shadowColor: '#22c55e',
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },

  emptyBox: {
    backgroundColor: '#eee',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyText: {
    color: '#777',
    fontSize: 14,
  },
  emptySmall: {
    color: '#999',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
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

  date: {
    fontSize: 12,
    color: '#777',
    fontWeight: '600',
  },

  completedBadge: {
    backgroundColor: '#e6f9ed',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  completedText: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: 'bold',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },

  type: {
    fontSize: 12,
    color: '#555',
  },

  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },

  timelineRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 4,
  },
  timelineRight: {
    flex: 1,
  },
  outerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000',
  },
  line: {
    width: 1.5,
    height: 30,
    backgroundColor: '#ccc',
    marginVertical: 4,
  },
});