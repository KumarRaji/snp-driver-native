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
    Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen = () => {
    const navigation = useNavigation<any>();

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        aadharNo: '',
        licenseNo: '',
        alternateMobile1: '',
        alternateMobile2: '', // ✅ ADD THIS
        gpayNo: '',
    });

    const [images, setImages] = useState<any>({});

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
        if (!image) return '';

        const formData = new FormData();
        formData.append('file', {
            uri: image.uri,
            name: 'file.jpg',
            type: 'image/jpeg',
        } as any);

        const res = await fetch(`${API_BASE_URL}/api/upload/file`, {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();
        return data.fileId;
    };

    // 🚀 Register
    const handleRegister = async () => {
        if (!form.name || !form.phone || !form.password) {
            Alert.alert('Error', 'Please fill required fields');
            return;
        }

        setLoading(true);

        try {
            const photo = await uploadFile(images.photo);
            const dlPhoto = await uploadFile(images.dlPhoto);
            const panPhoto = await uploadFile(images.panPhoto);
            const aadharPhoto = await uploadFile(images.aadharPhoto);

            const response = await fetch(
                `${API_BASE_URL}/api/driver/auth/register`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        accept: 'application/json',
                    },
                    body: JSON.stringify({
                        name: form.name,
                        email: form.email,
                        phone: form.phone,
                        password: form.password,
                        aadharNo: form.aadharNo,
                        licenseNo: form.licenseNo,

                        altPhone: [
                            form.alternateMobile1,
                            form.alternateMobile2,
                        ].filter(Boolean),

                        upiId: form.gpayNo,

                        photo,
                        dlPhoto,
                        panPhoto,
                        aadharPhoto,
                    }),
                }
            );

            const data = await response.json();

            console.log('REGISTER RESPONSE:', data);

            if (response.ok) {
                if (data.token) {
                    await AsyncStorage.setItem('auth-token', data.token);
                }

                Alert.alert('Success', 'Registration successful');

                navigation.replace('Home');
            } else {
                Alert.alert(
                    'Error',
                    data.message || data.error || 'Registration failed'
                );
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Network error');
        } finally {
            setLoading(false);
        }
    };


    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Driver Registration</Text>

            {[
                { key: 'name', label: 'Full Name' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'password', label: 'Password' },
                { key: 'aadharNo', label: 'Aadhar Number' },
                { key: 'licenseNo', label: 'License Number' },
                { key: 'alternateMobile1', label: 'Alternate Phone 1' },
                { key: 'alternateMobile2', label: 'Alternate Phone 2' }, // ✅ ADD
                { key: 'gpayNo', label: 'UPI ID' },
            ].map((item) => (
                <View key={item.key}>
                    <Text style={styles.label}>{item.label}</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry={item.key === 'password'}
                        value={(form as any)[item.key]}
                        onChangeText={(text) =>
                            setForm({ ...form, [item.key]: text })
                        }
                    />
                </View>
            ))}

            {/* Image Upload */}
            <Text style={styles.label}>Upload Documents</Text>

            <View style={styles.imageRow}>
                {['photo', 'dlPhoto', 'panPhoto', 'aadharPhoto'].map((key) => (
                    <TouchableOpacity
                        key={key}
                        style={styles.uploadBox}
                        onPress={() => pickImage(key)}
                    >
                        {images[key] ? (
                            <Image source={{ uri: images[key].uri }} style={styles.image} />
                        ) : (
                            <Text style={{ fontSize: 12 }}>Upload</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={handleRegister}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.btnText}>Register</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

export default RegisterScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        color: '#666',
        marginTop: 10,
    },
    input: {
        backgroundColor: '#eee',
        borderRadius: 10,
        padding: 10,
        marginTop: 5,
    },
    button: {
        backgroundColor: '#000',
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
        alignItems: 'center',
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    imageRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
    },
    uploadBox: {
        width: 80,
        height: 80,
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
}); 