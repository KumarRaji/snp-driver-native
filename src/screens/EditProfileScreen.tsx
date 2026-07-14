import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import CustomAlert from '../components/CustomAlert';

const BASE_URL = 'https://drivemate.api.luisant.cloud/api';

const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Pre-fill the form with the current profile data passed from ProfileScreen
  const profile = route.params?.profile || {};

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
    currentAddress: profile.currentAddress || '',
    permanentAddress: profile.permanentAddress || '',
    aadharNo: profile.aadharNo || '',
    licenseNo: profile.licenseNo || '',
    alternateMobile1: profile.alternateMobile1 || '',
    alternateMobile2: profile.alternateMobile2 || '',
    alternateMobile3: profile.alternateMobile3 || '',
    alternateMobile4: profile.alternateMobile4 || '',
    gpayNo: profile.gpayNo || profile.phonepeNo || '',
    password: ''
  });

  const [images, setImages] = useState<any>({});
  const [alertInfo, setAlertInfo] = useState({ visible: false, title: '', message: '', type: 'info' as const });

  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => setAlertInfo({ visible: true, title, message, type: type as 'info' });
  const hideAlert = () => setAlertInfo({ ...alertInfo, visible: false });

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
      const uploadedPolice = images.policeVerificationPhoto ? await uploadFile(images.policeVerificationPhoto) : undefined;

      const { password, ...restForm } = form;

      const payload: any = {
        ...restForm,
        currentAddress: form.currentAddress,
        permanentAddress: form.permanentAddress,
        ...(uploadedPhoto && { photo: uploadedPhoto }),
        ...(uploadedDl && { dlPhoto: uploadedDl }),
        ...(uploadedPan && { panPhoto: uploadedPan }),
        ...(uploadedAadhar && { aadharPhoto: uploadedAadhar }),
        ...(uploadedPolice && { policeVerificationPhoto: uploadedPolice }),
      };

      // Only append the password to the payload if the user typed a new one
      if (password && password.trim().length > 0) {
        payload.password = password.trim();
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
        showAlert('Success', 'Profile updated successfully!', 'success');
        setTimeout(() => { hideAlert(); navigation.goBack(); }, 1500);
      } else {
        const data = await res.json();
        showAlert('Error', data.message || data.error || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showAlert('Error', 'Network error occurred while saving.', 'error');
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {[
          { key: 'name', label: 'Full Name' },
          { key: 'phone', label: 'Phone', type: 'phone-pad' },
          { key: 'currentAddress', label: 'Current Address', multiline: true },
          { key: 'permanentAddress', label: 'Permanent Address', multiline: true },
          { key: 'password', label: 'Change Password', isPassword: true, placeholder: 'Enter new password (leave blank to keep current)', autoCapitalize: 'none', autoCorrect: false },
          { key: 'aadharNo', label: 'Aadhar Number', type: 'numeric' },
          { key: 'licenseNo', label: 'License Number' },
          { key: 'alternateMobile1', label: 'Alternate Phone 1', type: 'phone-pad' },
          { key: 'alternateMobile2', label: 'Alternate Phone 2', type: 'phone-pad' },
          { key: 'alternateMobile3', label: 'Alternate Phone 3', type: 'phone-pad' },
          { key: 'alternateMobile4', label: 'Alternate Phone 4', type: 'phone-pad' },
          { key: 'gpayNo', label: 'Gpay/PhonePe number' },
        ].map((field) => (
          <View key={field.key} style={styles.inputGroup}>
            <Text style={styles.label}>{field.label}</Text>
            {(field as any).isPassword ? (
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  value={(form as any)[field.key]}
                  onChangeText={(text) => handleChange(field.key, text)}
                  secureTextEntry={!showPassword}
                  placeholder={(field as any).placeholder}
                  placeholderTextColor="#999"
                  autoCapitalize={(field as any).autoCapitalize}
                  autoCorrect={(field as any).autoCorrect}
                />
                {(form as any)[field.key].length > 0 && (
                  <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeButton}>
                    <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#C0C0C0" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TextInput
                style={(field as any).multiline ? [styles.input, { height: 90, textAlignVertical: 'top' }] : styles.input}
                value={(form as any)[field.key]}
                onChangeText={(text) => handleChange(field.key, text)}
                keyboardType={(field.type as any) || 'default'}
                placeholder={(field as any).placeholder}
                placeholderTextColor={(field as any).placeholder ? '#999' : undefined}
                autoCapitalize={(field as any).autoCapitalize}
                autoCorrect={(field as any).autoCorrect}
                multiline={(field as any).multiline || false}
                numberOfLines={(field as any).multiline ? 3 : undefined}
              />
            )}
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
            { key: 'policeVerificationPhoto', label: 'Police Verification', icon: 'shield' },
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

      <CustomAlert
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={hideAlert}
      />
      </KeyboardAvoidingView>
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
  container: { padding: 20, paddingBottom: 100 },
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
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 15,
    color: '#000',
  },
  eyeButton: {
    paddingHorizontal: 12,
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