// src/components/AppHeader.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProfile, handleLogoutIfRequired } from '../api/driverApi';
import CustomAlert from './CustomAlert';

const AppHeader = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ visible: false, title: '', message: '', type: 'info' as const, buttons: [] as any[] });

  const showAlert = (title: string, message: string, buttons: any[] = [], type: 'info' | 'success' | 'error' | 'warning' = 'info') => setAlertInfo({ visible: true, title, message, buttons, type: type as 'info' });
  const hideAlert = () => setAlertInfo({ ...alertInfo, visible: false });

  useFocusEffect(
    useCallback(() => {
      loadLocalProfile();
      fetchProfile();
    }, [])
  );

  const handleLogout = () => {
    setShowMenu(false);
    showAlert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel', onPress: hideAlert },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            hideAlert();
            await AsyncStorage.multiRemove(['auth-token', 'profile']);
            navigation.replace('Login');
          },
        },
      ],
      'warning'
    );
  };



  const loadLocalProfile = async () => {
    const stored = await AsyncStorage.getItem('profile');
    if (stored) {
      const user = JSON.parse(stored);
      setName(user?.name || '');
      setProfileImage(user?.image || null);
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      if (await handleLogoutIfRequired(data, navigation)) return;

      const user = data?.user || data;
      const fullName = user?.name || '';
      const image = user?.photo || null;

      setName(fullName);
      setProfileImage(image);
      setLoading(false);

      await AsyncStorage.setItem(
        'profile',
        JSON.stringify({ name: fullName, image })
      );
    } catch (e) {
      console.error('Profile error:', e);
      setLoading(false);
    }
  };

  const getInitial = (fullName?: string | null) => {
    if (!fullName) return '';
    return fullName.trim().charAt(0).toUpperCase();
  };

  return (
    <View style={styles.header}>
      <Text style={styles.logo}>SNP</Text>

      <View style={styles.right}>
        {/* Name + Avatar */}
        <View style={styles.profileRow}>
          {/* Full Name */}
          {!loading && name && (
            <Text style={styles.userName} numberOfLines={1}>
              {name}
            </Text>
          )}

          {/* Profile Circle */}
          <View style={styles.avatar}>
            {loading ? (
              <Feather name="loader" size={16} color="#000" />
            ) : profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {getInitial(name)}
              </Text>
            )}
          </View>
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

              <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
                <Text style={[styles.dropdownText, { color: '#ef4444' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <CustomAlert
          visible={alertInfo.visible}
          title={alertInfo.title}
          message={alertInfo.message}
          type={alertInfo.type}
          buttons={alertInfo.buttons}
        />
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

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  userName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    maxWidth: 100, // prevents overflow
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // 🔥 important
  },

  avatarText: {
    fontWeight: 'bold',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
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