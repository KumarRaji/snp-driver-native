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

      setProfile(data);
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

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Feather name="settings" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.avatar}>
          {profile?.photo ? (
            <Image source={{ uri: profile.photo }} style={styles.image} />
          ) : (
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0)}
            </Text>
          )}
        </View>

        <Text style={styles.name}>{profile?.name}</Text>
        <Text style={styles.phone}>{profile?.phone}</Text>
      </View>

      {/* STATS */}
      <View style={styles.card}>
        <Text style={styles.label}>Total Trips</Text>
        <Text style={styles.value}>
          {profile?.completedTrips || 0}
        </Text>
      </View>

      {/* SUBSCRIPTION */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Subscription</Text>

        {subscription?.plan ? (
          <>
            <Text style={styles.value}>
              {subscription.plan.name}
            </Text>
            <Text style={styles.subText}>
              {subscription.paymentMethod}
            </Text>
          </>
        ) : (
          <Text>No Active Plan</Text>
        )}
      </View>

      {/* DOCUMENTS */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Documents</Text>

        <Text>License: {profile?.licenseNo}</Text>
        <Text>Aadhar: {profile?.aadharNo}</Text>
      </View>

      {/* ALT PHONES */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Alternate Phones</Text>

        {profile?.altPhone?.length ? (
          profile.altPhone.map((p: string, i: number) => (
            <Text key={i}>Phone {i + 1}: {p}</Text>
          ))
        ) : (
          <Text>None</Text>
        )}
      </View>

      {/* PAYMENT */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>UPI</Text>
        <Text>{profile?.upiId || 'Not set'}</Text>
      </View>

      {/* DOCUMENT STATUS */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Uploads</Text>

        <Text>Photo: {profile?.photo ? '✓' : '✗'}</Text>
        <Text>DL: {profile?.dlPhoto ? '✓' : '✗'}</Text>
        <Text>PAN: {profile?.panPhoto ? '✓' : '✗'}</Text>
        <Text>Aadhar: {profile?.aadharPhoto ? '✓' : '✗'}</Text>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  header: {
    backgroundColor: '#000',
    padding: 20,
    alignItems: 'center',
  },

  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },

  settingsBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
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

  name: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
    fontWeight: 'bold',
  },

  phone: {
    color: '#ccc',
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

  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  subText: {
    color: '#666',
  },
});
