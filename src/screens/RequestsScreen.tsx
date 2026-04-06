import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  getRequests,
  respondRequest,
  getActiveSubscription,
} from '../api/driverApi';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const RequestsScreen = () => {
  const [tab, setTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [requests, setRequests] = useState<any[]>([]);
  const [hasPackage, setHasPackage] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<any>(null);
  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [])
  );

  const fetchRequests = async () => {
    try {
      const data = await getRequests();
      setRequests(data.requests || []);

      const sub = await getActiveSubscription();

      const hasActivePackage =
        sub &&
        (sub.status === 'ACTIVE' || sub.status === 'SUCCESS') &&
        new Date(sub.endDate) > new Date();

      setHasPackage(hasActivePackage);
      setActiveSub(sub);
    } catch (e) {
      console.log(e);
    }
  };

  const performAction = async (
    id: string,
    action: 'ACCEPTED' | 'REJECTED'
  ) => {
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

  const handleAction = (
    id: string,
    action: 'ACCEPTED' | 'REJECTED'
  ) => {
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

        {/* ❌ NO PACKAGE */}
        {!hasPackage && (
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠</Text>

            <Text style={styles.warningTitle}>Package Required</Text>

            <Text style={styles.warningText}>
              Please choose a driver package from the PACKAGES tab to start receiving booking requests.
            </Text>

            <TouchableOpacity 
              style={styles.packageBtn}
              onPress={() => navigation.navigate('PACKAGES')}
            >
              <Text style={styles.packageBtnText}>Go to Packages</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ✅ ACTIVE PACKAGE */}
        {hasPackage && (
          <View style={styles.activeCard}>
            <View style={styles.activeRow}>
              <Text style={styles.activeIcon}>✔</Text>
              <View>
                <Text style={styles.activeTitle}>Active Package</Text>
                <Text style={styles.activeName}>
                  {activeSub?.plan?.name || 'Package Active'}
                </Text>
              </View>
            </View>
            <View style={styles.greenDot} />
          </View>
        )}

        {/* EMPTY */}
        {hasPackage && requests.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📥</Text>
            <Text style={styles.emptyTitle}>No pending requests</Text>
          </View>
        )}

        {/* LIST */}
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

  /* WARNING */
  warningCard: {
    backgroundColor: '#fff7e6',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },

  warningIcon: {
    fontSize: 28,
    marginBottom: 10,
  },

  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#92400e',
  },

  warningText: {
    fontSize: 13,
    color: '#78350f',
    textAlign: 'center',
    marginBottom: 15,
  },

  packageBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  packageBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  /* ACTIVE */
  activeCard: {
    backgroundColor: '#f6f6f6',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  activeIcon: {
    fontSize: 18,
    color: 'green',
  },

  activeTitle: {
    fontSize: 12,
    color: '#777',
  },

  activeName: {
    fontWeight: 'bold',
  },

  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'green',
  },

  /* EMPTY */
  emptyBox: {
    backgroundColor: '#f3f3f3',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  emptyIcon: {
    fontSize: 30,
    marginBottom: 5,
  },

  emptyTitle: {
    color: '#777',
  },

  /* CARD */
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