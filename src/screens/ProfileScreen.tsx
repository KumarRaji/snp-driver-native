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
import Svg, { Path } from 'react-native-svg';
import { getProfile, getActiveSubscription, handleLogoutIfRequired, getTrips } from '../api/driverApi';

const BASE_URL = 'https://drivemate.api.luisant.cloud/api';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      if (await handleLogoutIfRequired(data, navigation)) return;

      const subData = await getActiveSubscription();
      if (await handleLogoutIfRequired(subData, navigation)) return;

      const tripsData = await getTrips();
      if (await handleLogoutIfRequired(tripsData, navigation)) return;

      setProfile(data?.user || data);
      setSubscription(subData);
      setTrips(tripsData?.trips || tripsData?.bookings || []);
    } catch (err) {
      console.error('Fetch Profile Error:', err);
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
        <View style={styles.statsContainer}>
          <View
            style={[
              styles.card,
              {
                flex: 1,
                minHeight: 90,
                justifyContent: 'center',
              },
            ]}
          >
            <View style={styles.statsRow}>
              <View style={styles.iconCircle}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </Svg>
              </View>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    color: '#7a7a7a',
                    fontWeight: '500',
                  }}
                >
                  Total Trips
                </Text>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: '#000',
                    marginTop: 1,
                  }}
                >
                  {trips.length}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                flex: 1,
                minHeight: 90,
                justifyContent: 'center',
              },
            ]}
          >
            <View style={styles.statsRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FBBF24' }]}>
                <Feather name="star" size={20} color="#fff" />
              </View>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    color: '#7a7a7a',
                    fontWeight: '500',
                  }}
                >
                  Avg Rating
                </Text>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: '#000',
                    marginTop: 1,
                  }}
                >
                  {(profile?.rating ?? 0).toFixed(1)}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: '#666',
                    marginTop: 1,
                  }}
                >
                  ({profile?.rating ? 1 : 0} ratings)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* SUBSCRIPTION */}
        <View style={styles.card}>
          <View style={[styles.infoRow, !subscription?.plan && { justifyContent: 'center', marginBottom: 6 }]}>
            <Text style={styles.label}>
              {subscription?.plan ? 'Current Plan' : 'No Active Plan'}
            </Text>
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
              <View style={styles.noPlanContainer}>
                <View style={styles.warningIconCircle}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </Svg>
                </View>
                <Text style={[styles.noPlanText, { flex: 1 }]}>You don't have any current plan</Text>
              </View>
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
          <View style={[styles.infoRow, { marginTop: 10 }]}>
            <Text style={styles.label}>Current Address</Text>
            <Text style={styles.rowValue}>{profile?.currentAddress || 'Not set'}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 10 }]}>
            <Text style={styles.label}>Permanent Address</Text>
            <Text style={styles.rowValue}>{profile?.permanentAddress || 'Not set'}</Text>
          </View>
        </View>

        {/* PAYMENT */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment & Contact</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Gpay/PhonePe number</Text>
            <Text style={styles.rowValue}>{profile?.gpayNo || profile?.phonepeNo || 'Not set'}</Text>
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

        {/* DOCUMENT STATUS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Uploads</Text>

          <View style={styles.docGrid}>
            {[
              { label: 'Photo', uri: profile?.photo },
              { label: 'Driving License', uri: profile?.dlPhoto, expiry: profile?.licenseExpiryDate },
              { label: 'PAN Card', uri: profile?.panPhoto },
              { label: 'Aadhar Card', uri: profile?.aadharPhoto },
              { label: 'Police Verification', uri: profile?.policeVerificationPhoto, expiry: profile?.policeVerificationExpiryDate },
            ].map((doc, i) => (
              <View key={i} style={styles.docBox}>
                <Text style={styles.docLabel}>{doc.label}</Text>
                {doc.uri ? (
                  <Image source={{ uri: doc.uri }} style={styles.docImage} resizeMode="cover" />
                ) : (
                  <View style={styles.docMissing}>
                    <Text style={{ color: '#999', fontSize: 12 }}>Not Uploaded</Text>
                  </View>
                )}
                {'expiry' in doc && (
                  <Text style={styles.expiryText}>Expiry: {doc.expiry || 'Not set'}</Text>
                )}
              </View>
            ))}
          </View>
          <Text style={styles.uploadNote}>Note: Document uploaded successfully. Admin will verify it shortly.</Text>
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
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    elevation: 2,
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
    backgroundColor: '#f9fafb',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  paymentBadgeText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: 'bold',
  },

  noPlanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 12,
  },

  noPlanText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },

  planBtn: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
  },

  planBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },

  warningIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9ca3af',
    justifyContent: 'center',
    alignItems: 'center',
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

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
    gap: 10,
  },
  expiryText: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  uploadNote: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
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
