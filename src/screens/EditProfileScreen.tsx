import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';

const BASE_URL = 'https://drivemate.api.luisant.cloud/api';

const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Pre-fill the form with the current profile data passed from ProfileScreen
  const profile = route.params?.profile || {};

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    aadharNo: profile.aadharNo || '',
    licenseNo: profile.licenseNo || '',
    alternateMobile1: profile.alternateMobile1 || '',
    alternateMobile2: profile.alternateMobile2 || '',
    alternateMobile3: profile.alternateMobile3 || '',
    alternateMobile4: profile.alternateMobile4 || '',
    gpayNo: profile.gpayNo || profile.phonepeNo || '',
    password: '',
  });

  const [images, setImages] = useState<any>({});

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // 📸 Pick Image
  const pickImage = async (field: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages({ ...images, [field]: result.assets[0] });
    }
  };

  // 📤 Upload File
  const uploadFile = async (image: any) => {
    if (!image) return null;

    const formData = new FormData();
    formData.append('file', {
      uri: image.uri,
      name: 'file.jpg',
      type: 'image/jpeg',
    } as any);

    const res = await fetch(`${BASE_URL}/upload/file`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    return data.fileId;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth-token');
      
      // Upload any new images first
      const uploadedPhoto = images.photo ? await uploadFile(images.photo) : undefined;
      const uploadedDl = images.dlPhoto ? await uploadFile(images.dlPhoto) : undefined;
      const uploadedPan = images.panPhoto ? await uploadFile(images.panPhoto) : undefined;
      const uploadedAadhar = images.aadharPhoto ? await uploadFile(images.aadharPhoto) : undefined;

      const payload = {
        ...form,
        ...(uploadedPhoto && { photo: uploadedPhoto }),
        ...(uploadedDl && { dlPhoto: uploadedDl }),
        ...(uploadedPan && { panPhoto: uploadedPan }),
        ...(uploadedAadhar && { aadharPhoto: uploadedAadhar }),
      };

    // Do not send empty password if the user isn't trying to change it
    if (!payload.password) {
      delete (payload as any).password;
    }

      // Submitting the updated details to the server
      const res = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Alert.alert('Success', 'Profile updated successfully!');
        navigation.goBack();
      } else {
        const data = await res.json();
        Alert.alert('Error', data.message || data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Network error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <AppHeader />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {[
          { key: 'name', label: 'Full Name' },
          { key: 'email', label: 'Email', type: 'email-address' },
          { key: 'phone', label: 'Phone', type: 'phone-pad' },
          { key: 'aadharNo', label: 'Aadhar Number', type: 'numeric' },
          { key: 'licenseNo', label: 'License Number' },
          { key: 'alternateMobile1', label: 'Alternate Phone 1', type: 'phone-pad' },
          { key: 'alternateMobile2', label: 'Alternate Phone 2', type: 'phone-pad' },
          { key: 'alternateMobile3', label: 'Alternate Phone 3', type: 'phone-pad' },
          { key: 'alternateMobile4', label: 'Alternate Phone 4', type: 'phone-pad' },
          { key: 'gpayNo', label: 'UPI ID (GPay/PhonePe)' },
        ].map((field) => (
          <View key={field.key} style={styles.inputGroup}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              value={(form as any)[field.key]}
              onChangeText={(text) => handleChange(field.key, text)}
              keyboardType={(field.type as any) || 'default'}
            />
          </View>
        ))}

        {/* Image Uploads */}
        <Text style={[styles.label, { marginTop: 10 }]}>Upload Documents</Text>
        <View style={styles.uploadGrid}>
          {[
            { key: 'photo', label: 'Photo', icon: 'image' },
            { key: 'dlPhoto', label: 'Driving License', icon: 'file-text' },
            { key: 'panPhoto', label: 'PAN Card', icon: 'credit-card' },
            { key: 'aadharPhoto', label: 'Aadhar Card', icon: 'file' },
          ].map((item) => {
            const currentImage = images[item.key]?.uri || profile[item.key];
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.uploadBox}
                onPress={() => pickImage(item.key)}
              >
                {currentImage ? (
                  <Image source={{ uri: currentImage }} style={styles.image} />
                ) : (
                  <View style={styles.uploadContent}>
                    <Feather name={item.icon as any} size={22} color="#6b7280" style={styles.icon} />
                    <Text style={styles.uploadText}>{item.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Change Password */}
        <View style={[styles.inputGroup, { marginTop: 25 }]}>
          <Text style={styles.label}>Change Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter new password (leave blank to keep current)"
            placeholderTextColor="#999"
            secureTextEntry
            value={form.password}
            onChangeText={(text) => handleChange('password', text)}
          />
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.stickyFooter}>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  header: { 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  headerTitle: { color: '#000', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  backBtn: { paddingRight: 5 },
  container: { padding: 20, paddingBottom: 40 },
  inputGroup: { marginBottom: 15 },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    fontSize: 15,
    color: '#000',
  },
  stickyFooter: {
    padding: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
  saveBtn: {
    flex: 1,
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  uploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    rowGap: 12,
  },
  uploadBox: {
    width: '48%',
    height: 95,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  uploadContent: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 5,
  },
  uploadText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
});