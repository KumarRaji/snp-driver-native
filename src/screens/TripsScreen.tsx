import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { getTrips, handleLogoutIfRequired } from '../api/driverApi';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../api/config';

const formatDateTime = (value: string) => {
  if (!value) return '';
  const d = new Date(value);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
};

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
      case 'CANCELLED_BY_DRIVER':
      case 'CANCELLED_BY_CUSTOMER':
        return '#e74c3c';
      default:
        return '#999';
    }
  };

  const handleCancelTrip = async (tripId: string) => {
    Alert.alert(
      'Cancel Trip',
      'Are you sure you want to request cancellation?\n\nIf approved by the Admin, 1 duty will be deducted from your package.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth-token');
              const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/request-cancel`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });
              const data = await response.json();
              if (response.ok) {
                Alert.alert('Success', 'Cancellation request submitted successfully.');
                fetchTrips();
              } else {
                Alert.alert('Error', data.error || 'Failed to request cancellation.');
              }
            } catch (e) {
              Alert.alert('Error', 'Network Error');
            }
          },
        },
      ]
    );
  };

  const getCancelledLabel = (trip: any) => {
    const reason = trip.cancellationReason?.toLowerCase() || '';
    if (reason.includes('driver')) return 'Cancelled by Driver';
    if (reason.includes('customer')) return 'Cancelled by Customer';
    return 'Cancelled';
  };

  const upcomingTrips = trips.filter(
    (t) => (t.status === 'CONFIRMED' || t.status === 'ONGOING') && !t.cancellationRequested
  );

  const completedTrips = trips.filter(
    (t) => t.status === 'COMPLETED'
  );

  const cancellationPendingTrips = trips.filter(
    (t) => t.cancellationRequested === true && t.status !== 'CANCELLED'
  );

  const cancelledTrips = trips.filter(
    (t) => t.status === 'CANCELLED' || t.status === 'CANCELLED_BY_DRIVER' || t.status === 'CANCELLED_BY_CUSTOMER'
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
              <View style={styles.tripTypeBadge}>
                <Text style={styles.tripTypeText}>
                  {trip.serviceType || trip.tripType || trip.packageType || '-'}
                </Text>
              </View>
              <Text style={[styles.status, { color: trip.cancellationRequested ? '#d97706' : getStatusColor(trip.status) }]}>
                {trip.cancellationRequested ? 'CANCELLATION PENDING' : trip.status}
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

            {trip.status === 'CONFIRMED' && !trip.cancellationRequested && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelTrip(trip.id)}
              >
                <Feather name="x" size={16} color="#ef4444" />
                <Text style={styles.cancelButtonText}>Cancel Trip</Text>
              </TouchableOpacity>
            )}
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
              <View>
                <Text style={styles.startText}>
                  Start: {formatDateTime(trip.actualStartTime || `${trip.startDate}T${trip.startTime}`)}
                </Text>
                {!!trip.completedAt && (
                  <Text style={styles.endText}>
                    Ended: {formatDateTime(trip.completedAt)}
                  </Text>
                )}
              </View>
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
              <View>
                <View style={styles.serviceRow}>
                  <Text style={styles.serviceType}>{trip.serviceType}</Text>
                  {!!trip.duration && (
                    <View style={styles.durationBadge}>
                      <Feather name="clock" size={12} color="#666" />
                      <Text style={styles.durationText}>{trip.duration}</Text>
                    </View>
                  )}
                </View>
                {!!trip.rating && (
                  <View style={styles.ratingContainer}>
                    <Text style={styles.star}>{'★'.repeat(trip.rating)}</Text>
                    {!!trip.feedback && (
                      <Text style={styles.feedback}>"{trip.feedback}"</Text>
                    )}
                  </View>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amountLabel}>FINAL AMOUNT</Text>
                <Text style={styles.amount}>₹{trip.finalAmount || trip.estimateAmount || 0}</Text>
                {(trip.finalAmount || 0) > (trip.estimateAmount || 0) && (
                  <Text style={styles.extraText}>
                    Includes ₹{(trip.finalAmount || 0) - (trip.estimateAmount || 0)} Extra
                  </Text>
                )}
              </View>
            </View>

          </View>
        ))
      )}

      {/* 🔥 Cancellation Pending Section */}
      <Text style={[styles.header, { marginTop: 20, marginBottom: 15 }]}>Cancellation Pending</Text>

      {cancellationPendingTrips.length === 0 ? (
        <Text style={styles.emptySmall}>No pending cancellations.</Text>
      ) : (
        cancellationPendingTrips.map((trip) => (
          <View key={trip.id} style={styles.card}>
            <View style={styles.topRow}>
              <View style={styles.tripTypeBadge}>
                <Text style={styles.tripTypeText}>
                  {trip.serviceType || trip.tripType || '-'}
                </Text>
              </View>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>Cancellation Pending</Text>
              </View>
            </View>

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

            <Text style={[styles.label, { marginTop: 10 }]}>EST. AMOUNT</Text>
            <Text style={styles.earnings}>₹{trip.estimateAmount || 0}</Text>
          </View>
        ))
      )}

      {/* 🔥 Cancelled Section */}
      <Text style={[styles.header, { marginTop: 20, marginBottom: 15 }]}>Cancelled Trips</Text>

      {cancelledTrips.length === 0 ? (
        <Text style={styles.emptySmall}>No cancelled trips.</Text>
      ) : (
        cancelledTrips.map((trip) => (
          <View key={trip.id} style={styles.card}>
            <View style={styles.topRow}>
              <View style={styles.tripTypeBadge}>
                <Text style={styles.tripTypeText}>
                  {trip.serviceType || trip.tripType || '-'}
                </Text>
              </View>
              <View style={styles.cancelledBadge}>
                <Text style={styles.cancelledText}>{getCancelledLabel(trip)}</Text>
              </View>
            </View>

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

            <Text style={[styles.label, { marginTop: 10 }]}>EST. AMOUNT</Text>
            <Text style={styles.earnings}>₹{trip.estimateAmount || 0}</Text>
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

  tripTypeBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  tripTypeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
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

  cancelledBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  cancelledText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: 'bold',
  },

  pendingBadge: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  pendingText: {
    color: '#c2410c',
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
    color: '#16a34a',
  },

  startText: { fontSize: 12, color: '#666', fontWeight: '700' },
  endText: { fontSize: 12, color: '#16a34a', fontWeight: '700', marginTop: 2 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  serviceType: { fontSize: 13, color: '#555', marginRight: 8 },
  durationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  durationText: { marginLeft: 4, fontSize: 11, color: '#666' },
  amountLabel: { fontSize: 10, color: '#888', fontWeight: '700' },
  extraText: { color: '#dc2626', fontSize: 10, marginTop: 4, fontWeight: '600' },
  ratingContainer: { marginTop: 4 },
  star: { color: '#FBBF24', fontSize: 16 },
  feedback: { color: '#666', fontStyle: 'italic', fontSize: 12, marginTop: 2 },

  cancelButton: { marginTop: 10, borderWidth: 1, borderColor: '#EF4444', borderRadius: 8, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  cancelButtonText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },

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
    width: 2,
    flex: 1,
    backgroundColor: '#666',
    marginVertical: 6,
    borderRadius: 2,
  },

});