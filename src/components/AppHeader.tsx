// src/components/AppHeader.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

const AppHeader = () => {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('auth-token');

      const res = await fetch(
        'https://drivemate.api.luisant.cloud/api/auth/profile',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setName(data?.name || '');
    } catch (e) {
      console.log(e);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('auth-token');
    navigation.replace('Login');
  };

  return (
    <View style={styles.header}>
      <Text style={styles.logo}>SNP</Text>

      <View style={styles.right}>
        {/* Profile Circle */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name ? name.charAt(0).toUpperCase() : 'N'}
          </Text>
        </View>

        {/* Settings Icon */}
        <TouchableOpacity
          style={styles.icon}
          onPress={() => setShowMenu(!showMenu)}
        >
          <Feather name="settings" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Dropdown Menu */}
        {showMenu && (
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowMenu(false);
              navigation.navigate('Profile');
              }}
            >
              <Text style={styles.dropdownText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
              <Text style={[styles.dropdownText, { color: '#ef4444' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default AppHeader;

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#000',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10, // Ensure the dropdown overlaps the tabs below
  },

  logo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontWeight: 'bold',
  },

  icon: {
    padding: 6,
  },

  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 120,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});