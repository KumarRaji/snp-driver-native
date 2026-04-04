import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getRequests, respondRequest } from '../api/driverApi';

const RequestsScreen = () => {
  const [tab, setTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [requests, setRequests] = useState<any[]>([]);
  const [hasPackage, setHasPackage] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await getRequests();
      setRequests(data.requests || []);
      setHasPackage(data.requests && data.requests.length > 0);
    } catch (e) {
      console.log(e);
    }
  };

  const performAction = async (id: string, action: 'ACCEPTED' | 'REJECTED') => {
    try {
      setLoadingId(id);
      await respondRequest(id, action);
      fetchRequests();
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleAction = (id: string, action: 'ACCEPTED' | 'REJECTED') => {
    Alert.alert(
      action === 'ACCEPTED' ? 'Accept Request?' : 'Reject Request?',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => performAction(id, action),
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      {/* ✅ CONTENT */}
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* TOGGLE */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.tab, tab === 'NEW' && styles.activeTab]}
            onPress={() => setTab('NEW')}
          >
            <Text style={tab === 'NEW' ? styles.activeText : styles.text}>
              New Requests
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, tab === 'HISTORY' && styles.activeTab]}
            onPress={() => setTab('HISTORY')}
          >
            <Text style={tab === 'HISTORY' ? styles.activeText : styles.text}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* NO PACKAGE */}
        {!hasPackage && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠ Package Required</Text>
            <Text style={styles.warningText}>
              Please choose a driver package from the PACKAGES tab to start receiving booking requests.
            </Text>

            <TouchableOpacity style={styles.packageBtn}>
              <Text style={{ color: '#fff' }}>Go to Packages</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* REQUEST LIST */}
        {hasPackage &&
          requests.map((req) => (
            <View key={req.id} style={styles.card}>
              <Text style={styles.location}>
                {req.booking.pickupLocation}
              </Text>

              <Text style={styles.arrow}>↓</Text>

              <Text style={styles.location}>
                {req.booking.dropLocation}
              </Text>

              <Text style={styles.price}>
                ₹{req.booking.estimateAmount}
              </Text>

              {/* ACTIONS */}
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.reject}
                  onPress={() => handleAction(req.id, 'REJECTED')}
                  disabled={loadingId === req.id}
                >
                  {loadingId === req.id ? (
                    <ActivityIndicator />
                  ) : (
                    <Text>Decline</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.accept}
                  onPress={() => handleAction(req.id, 'ACCEPTED')}
                  disabled={loadingId === req.id}
                >
                  {loadingId === req.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff' }}>Accept</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
      </ScrollView>
    </View>
  );
};

export default RequestsScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },

  container: {
    padding: 15,
    paddingBottom: 40,
  },

  toggle: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 15,
  },

  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: '#000',
    borderRadius: 10,
  },

  text: { color: '#666' },
  activeText: { color: '#fff', fontWeight: 'bold' },

  warningCard: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
  },

  warningTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },

  warningText: {
    color: '#555',
    marginBottom: 10,
  },

  packageBtn: {
    backgroundColor: '#f59e0b',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  card: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
  },

  location: { color: '#fff', fontWeight: 'bold' },
  arrow: { color: '#fff', textAlign: 'center' },
  price: { color: '#0f0', marginTop: 10 },

  row: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },

  reject: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
  },

  accept: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
});