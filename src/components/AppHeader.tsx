// src/components/AppHeader.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProfile, handleLogoutIfRequired } from '../api/driverApi';

const AppHeader = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('auth-token');
    navigation.replace('Login');
  };

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      if (await handleLogoutIfRequired(data, navigation)) return;

      const fullName = data?.user?.name || data?.name || '';
      setName(fullName);
    } catch (e) {
      console.error('Profile error:', e);
    }
  };

  const getInitial = (fullName: string) => {
    if (!fullName) return 'D';
    return fullName.trim().charAt(0).toUpperCase();
  };

  return (
    <View style={styles.header}>
      <Text style={styles.logo}>SNP</Text>

      <View style={styles.right}>
        {/* Profile Circle */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitial(name)}
          </Text>
        </View>

        {/* Settings Icon */}
        <TouchableOpacity
          style={styles.icon}
          onPress={() => setShowMenu(true)}
        >
          <Feather name="settings" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Dropdown Menu */}
        <Modal
          visible={showMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPressOut={() => setShowMenu(false)}
          >
            <View style={[styles.dropdown, { top: insets.top + 40 }]}>
              <TouchableOpacity
                style={[
                  styles.dropdownItem,
                  route.name === 'Profile' && styles.activeDropdownItem
                ]}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('Profile');
                }}
              >
                <Text 
                  style={[
                    styles.dropdownText, 
                    route.name === 'Profile' && { color: '#2563eb', fontWeight: 'bold' }
                  ]}
                >
                  Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); handleLogout(); }}>
                <Text style={[styles.dropdownText, { color: '#ef4444' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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

  modalOverlay: {
    flex: 1,
  },

  dropdown: {
    position: 'absolute',
    right: 15,
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
  activeDropdownItem: {
    backgroundColor: '#eff6ff',
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});