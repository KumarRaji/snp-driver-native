import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_URL = 'https://drivemate.api.luisant.cloud/api';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const getHeaders = async () => {
    const token = await AsyncStorage.getItem('auth-token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchProfile = async () => {
    try {
      const headers = await getHeaders();

      const res = await fetch(`${BASE_URL}/auth/profile`, { headers });
      const data = await res.json();

      const subRes = await fetch(`${BASE_URL}/subscriptions/driver`, {
        headers,
      });
      const subData = await subRes.json();

      setProfile(data?.user || data);
      setSubscription(subData);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  const getDaysLeft = () => {
    if (!subscription?.endDate) return null;

    const end = new Date(subscription.endDate).getTime();
    const now = new Date().getTime();

    const diff = end - now;

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return days > 0 ? days : 0;
  };
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <AppHeader />
      <ScrollView style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {profile?.photo ? (
                <Image source={{ uri: profile.photo }} style={styles.image} />
              ) : (
                <Text style={styles.avatarText}>
                  {profile?.name?.charAt(0)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.name}>{profile?.name}</Text>
              <Text style={styles.phone}>{profile?.phone}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile', { profile })}
            >
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.card}>
          <Text style={styles.label}>Total Trips</Text>
          <Text style={styles.value}>
            {profile?.totalRides || 0}
          </Text>
        </View>

        {/* SUBSCRIPTION */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Current Plan</Text>
            {subscription?.plan && (
              <View style={styles.paymentBadge}>
                <Text style={styles.paymentBadgeText}>{subscription.paymentMethod}</Text>
              </View>
            )}
          </View>

          {subscription?.plan ? (
            <>
              <Text style={[styles.value, { marginTop: 4 }]}>
                {subscription.plan.name}
              </Text>

              {/* 🔥 DAYS LEFT BADGE */}
              {getDaysLeft() !== null && (
                <View style={[styles.daysBadge, { alignSelf: 'flex-start', marginTop: 10 }]}>
                  <Text style={styles.daysText}>{getDaysLeft()} days left</Text>
                </View>
              )}
            </>
          ) : (
            <View>
              <Text style={styles.noPlanText}>You don't have any current plan</Text>
              <TouchableOpacity 
                style={styles.planBtn}
                onPress={() => navigation.navigate('DriverTabs', { screen: 'PACKAGES' })}
              >
                <Text style={styles.planBtnText}>Make Plan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* DOCUMENTS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Documents</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>License</Text>
            <Text style={styles.rowValue}>{profile?.licenseNo || 'Not set'}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 10 }]}>
            <Text style={styles.label}>Aadhar</Text>
            <Text style={styles.rowValue}>{profile?.aadharNo || 'Not set'}</Text>
          </View>
        </View>

        {/* ALT PHONES */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Alternate Phones</Text>

          {(() => {
            const alts = [
              profile?.alternateMobile1,
              profile?.alternateMobile2,
              profile?.alternateMobile3,
              profile?.alternateMobile4,
            ].filter(Boolean);

            if (!alts.length) return <Text style={styles.label}>None</Text>;
            return alts.map((p, i) => (
              <View key={i} style={[styles.infoRow, { marginTop: i > 0 ? 10 : 0 }]}>
                <Text style={styles.label}>Phone {i + 1}</Text>
                <Text style={styles.rowValue}>{p}</Text>
              </View>
            ));
          })()}
        </View>

        {/* PAYMENT */}
        <View style={[styles.card, styles.rowCard]}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>UPI</Text>
          <Text style={styles.rowValue}>{profile?.gpayNo || profile?.phonepeNo || 'Not set'}</Text>
        </View>

        {/* DOCUMENT STATUS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Uploads</Text>

          <View style={styles.docGrid}>
            {[
              { label: 'Photo', uri: profile?.photo },
              { label: 'Driving License', uri: profile?.dlPhoto },
              { label: 'PAN Card', uri: profile?.panPhoto },
              { label: 'Aadhar Card', uri: profile?.aadharPhoto },
            ].map((doc, i) => (
              <View key={i} style={styles.docBox}>
                <Text style={styles.docLabel}>{doc.label}</Text>
                {doc.uri ? (
                  <Image source={{ uri: doc.uri }} style={styles.docImage} resizeMode="cover" />
                ) : (
                  <View style={styles.docMissing}>
                    <Text style={{ color: '#999', fontSize: 12 }}>Missing</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  header: {
    padding: 20,
  },

  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },

  avatarContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  image: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  infoLeft: {
    flex: 1,
  },

  name: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },

  phone: {
    color: '#666',
    marginTop: 4,
  },

  editBtn: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  editText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 12,
  },

  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },

  label: {
    color: '#888',
  },

  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  rowValue: {
    color: '#444',
    fontSize: 15,
    fontWeight: 'bold',
  },

  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  subText: {
    color: '#666',
  },

  paymentBadge: {
    backgroundColor: '#666',
    borderColor: '#666',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  paymentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  noPlanText: {
    color: '#666',
    marginBottom: 12,
  },

  planBtn: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  planBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },

  daysBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  daysText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: 'bold',
  },

  docGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  
  docBox: {
    width: '48%',
    marginBottom: 15,
  },

  docLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: 'bold',
  },

  docImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#eee',
  },

  docMissing: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
