import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { getTrips } from '../api/driverApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

const HomeScreen = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  const fetchTrips = async () => {
    try {
      const data = await getTrips();
      setTrips(data?.bookings || data?.trips || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const activeTrips = trips.filter(
    (t) =>
      t.status === 'ONGOING' ||
      t.status === 'CONFIRMED' ||
      t.status === 'ACCEPTED'
  );

  const completeTrip = async (id: string) => {
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
        setModalVisible(false);
        setSelectedTrip(null);
        fetchTrips(); // Refresh the list to remove the completed trip
      } else {
        Alert.alert('Error', data.error || data.message || 'Failed to complete trip');
      }
    } catch (e) {
      console.error('Complete Trip Error:', e);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoadingId(null);
    }
  };

  const handleCompletePress = (trip: any) => {
    setSelectedTrip(trip);
    setModalVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F4F4' }}>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {activeTrips.length > 0 && (
        <View style={styles.titleRow}>
          <View style={styles.greenDot} />
          <Text style={styles.title}>Ongoing Trips</Text>
        </View>
      )}

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

            {/* Timeline & Locations */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={styles.outerDot}><View style={styles.innerDot} /></View>
                <View style={styles.line} />
                <Feather name="map-pin" size={14} color="#fff" />
              </View>
              <View style={styles.timelineRight}>
                <Text style={styles.label}>FROM</Text>
                <Text style={styles.location}>{trip.pickupLocation}</Text>
                <Text style={[styles.label, { marginTop: 10 }]}>TO</Text>
                <Text style={styles.location}>{trip.dropLocation}</Text>
              </View>
            </View>

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

    {/* 🔥 Custom Complete Trip Modal */}
    <Modal visible={modalVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Complete Trip</Text>
          <Text style={styles.modalSub}>Mark this trip as completed?</Text>

          {selectedTrip && (
            <View style={styles.modalTimelineRow}>
              <View style={styles.modalTimelineLeft}>
                <View style={styles.modalOuterDot}><View style={styles.modalInnerDot} /></View>
                <View style={styles.modalLine} />
                <Feather name="map-pin" size={14} color="#000" />
              </View>
              <View style={styles.timelineRight}>
                <Text style={styles.modalLabel}>FROM</Text>
                <Text style={styles.modalLocation}>{selectedTrip.pickupLocation}</Text>
                <Text style={[styles.modalLabel, { marginTop: 6 }]}>TO</Text>
                <Text style={styles.modalLocation}>{selectedTrip.dropLocation}</Text>
              </View>
            </View>
          )}

          <View style={styles.modalBtnRow}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setModalVisible(false);
                setSelectedTrip(null);
              }}
              disabled={loadingId === selectedTrip?.id}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => {
                if (selectedTrip) completeTrip(selectedTrip.id);
              }}
              disabled={loadingId === selectedTrip?.id}
            >
              {loadingId === selectedTrip?.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalConfirmText}>Complete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </View>
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
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  line: {
    width: 1.5,
    height: 30,
    backgroundColor: '#444',
    marginVertical: 4,
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

/* Modal Styles */
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  padding: 20,
},
modalContent: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 20,
},
modalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 5,
},
modalSub: {
  color: '#666',
  marginBottom: 20,
},
modalTimelineRow: {
  flexDirection: 'row',
  marginBottom: 25,
  backgroundColor: '#f9f9f9',
  padding: 15,
  borderRadius: 12,
},
modalTimelineLeft: {
  alignItems: 'center',
  marginRight: 10,
  paddingTop: 4,
},
modalOuterDot: {
  width: 12,
  height: 12,
  borderRadius: 6,
  borderWidth: 2,
  borderColor: '#000',
  alignItems: 'center',
  justifyContent: 'center',
},
modalInnerDot: {
  width: 4,
  height: 4,
  borderRadius: 2,
  backgroundColor: '#000',
},
modalLine: {
  width: 1.5,
  flex: 1,
  minHeight: 15,
  backgroundColor: '#ccc',
  marginVertical: 2,
},
modalLabel: {
  fontSize: 11,
  color: '#888',
  fontWeight: 'bold',
},
modalLocation: {
  fontSize: 14,
  fontWeight: '600',
  color: '#000',
  marginTop: 2,
},
modalBtnRow: {
  flexDirection: 'row',
  gap: 12,
},
modalCancelBtn: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 8,
  backgroundColor: '#eee',
  alignItems: 'center',
},
modalCancelText: {
  fontWeight: 'bold',
  color: '#333',
},
modalConfirmBtn: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 8,
  backgroundColor: '#22c55e',
  alignItems: 'center',
},
modalConfirmText: {
  fontWeight: 'bold',
  color: '#fff',
},
});