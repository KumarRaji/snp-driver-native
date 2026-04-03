import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const API_BASE_URL = "https://makecallsnp.com";

const RegisterScreen = ({ navigation }: any) => {
  const [data, setData] = useState<any>({
    name: '',
    email: '',
    phone: '',
    password: '',
    aadharNo: '',
    licenseNo: '',
    gpayNo: '',
  });

  const [files, setFiles] = useState<any>({});

  const pickImage = async (key: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setFiles({ ...files, [key]: result.assets[0] });
    }
  };

  const uploadFile = async (file: any) => {
    if (!file) return '';

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: 'upload.jpg',
      type: 'image/jpeg',
    } as any);

    const res = await fetch(`${API_BASE_URL}/api/upload/file`, {
      method: 'POST',
      body: formData,
    });

    const json = await res.json();
    return json.fileId;
  };

  const handleRegister = async () => {
    try {
      const photo = await uploadFile(files.photo);
      const dl = await uploadFile(files.dl);
      const pan = await uploadFile(files.pan);
      const aadhar = await uploadFile(files.aadhar);

      const res = await fetch(`${API_BASE_URL}/api/driver/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          role: 'DRIVER',
          photo,
          dlPhoto: dl,
          panPhoto: pan,
          aadharPhoto: aadhar,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        Alert.alert('Success', 'Registered successfully');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (e) {
      Alert.alert('Error', 'Registration failed');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Driver Registration</Text>

      {[
        { key: 'name', placeholder: 'Full Name' },
        { key: 'email', placeholder: 'Email' },
        { key: 'phone', placeholder: 'Phone' },
        { key: 'password', placeholder: 'Password' },
        { key: 'aadharNo', placeholder: 'Aadhar Number' },
        { key: 'licenseNo', placeholder: 'License Number' },
        { key: 'gpayNo', placeholder: 'UPI ID' },
      ].map((field) => (
        <TextInput
          key={field.key}
          placeholder={field.placeholder}
          style={styles.input}
          secureTextEntry={field.key === 'password'}
          onChangeText={(text) =>
            setData({ ...data, [field.key]: text })
          }
        />
      ))}

      <Text style={styles.label}>Upload Documents</Text>

      {['photo', 'dl', 'pan', 'aadhar'].map((key) => (
        <TouchableOpacity
          key={key}
          style={styles.upload}
          onPress={() => pickImage(key)}
        >
          <Text>{files[key] ? '✓ Selected' : `Upload ${key}`}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.btnText}>Register</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  input: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  label: { marginTop: 10, marginBottom: 5, fontWeight: 'bold' },
  upload: {
    padding: 12,
    backgroundColor: '#eee',
    marginBottom: 10,
    borderRadius: 8,
  },
  button: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
});