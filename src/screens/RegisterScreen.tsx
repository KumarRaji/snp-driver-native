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
import { KeyboardAvoidingView, Platform } from 'react-native';
import { ImageBackground } from 'react-native';
import { Feather } from '@expo/vector-icons';


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
        alternateMobile2: '',
        alternateMobile3: '',
        alternateMobile4: '',
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
        if (!form.name || !form.phone || !form.password || !form.aadharNo || !form.licenseNo) {
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
                            form.alternateMobile3,
                            form.alternateMobile4,
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

            if (response.ok) {
                if (data.token) {
                    await AsyncStorage.setItem('auth-token', data.token);
                }

                Alert.alert('Success', 'Registration successful');

                navigation.replace('Login');
            } else {
                Alert.alert(
                    'Error',
                    data.message || data.error || 'Registration failed'
                );
            }
        } catch (error) {
            console.error('Registration Error:', error);
            Alert.alert('Error', 'Network error');
        } finally {
            setLoading(false);
        }
    };


    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ImageBackground
                source={{
                    uri: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7',
                }}
                style={{ flex: 1 }}
                blurRadius={3}
            >
                <View style={styles.overlay}>
                    <Text style={styles.logo}>SNP</Text>

                    <View style={styles.card}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 100 }}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                        >
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={styles.back}>← Back to Login</Text>
                            </TouchableOpacity>

                            <Text style={styles.title}>Driver Registration</Text>

                            {[
                                { key: 'name', label: 'Full Name' },
                                { key: 'email', label: 'Email' },
                                { key: 'phone', label: 'Phone' },
                                { key: 'password', label: 'Password' },
                                { key: 'aadharNo', label: 'Aadhar Number' },
                                { key: 'licenseNo', label: 'License Number' },
                                { key: 'alternateMobile1', label: 'Alternate Phone 1' },
                                { key: 'alternateMobile2', label: 'Alternate Phone 2' },
                                { key: 'alternateMobile3', label: 'Alternate Phone 3' },
                                { key: 'alternateMobile4', label: 'Alternate Phone 4' },
                                { key: 'gpayNo', label: 'UPI ID (GPay/PhonePe)', placeholder: 'yourname@upi' },
                            ].map((item) => (
                                <View key={item.key}>
                                    <Text style={styles.label}>{item.label}</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={item.placeholder}
                                        placeholderTextColor="#999"
                                        secureTextEntry={item.key === 'password'}
                                        value={(form as any)[item.key]}

                                        // ✅ Keyboard type
                                        keyboardType={
                                            item.key.includes('phone') || item.key.includes('Mobile') || item.key === 'aadharNo'
                                                ? 'phone-pad'
                                                : item.key === 'email'
                                                    ? 'email-address'
                                                    : 'default'
                                        }

                                        // ✅ Max length
                                        maxLength={
                                            item.key.includes('phone') || item.key.includes('Mobile')
                                                ? 10
                                                : item.key === 'aadharNo'
                                                    ? 12
                                                    : undefined
                                        }

                                        autoCapitalize="none"

                                        onChangeText={(text) => {
                                            let value = text;

                                            // ✅ Only numbers for phone + aadhar
                                            if (item.key.includes('phone') || item.key.includes('Mobile') || item.key === 'aadharNo') {
                                                value = text.replace(/[^0-9]/g, '');
                                            }

                                            setForm((prev) => ({
                                                ...prev,
                                                [item.key]: value,
                                            }));
                                        }}
                                    />


                                </View>
                            ))}

                            {/* Image Upload */}
                            <Text style={styles.label}>Upload Documents</Text>

                            <View style={styles.uploadGrid}>
                                {[
                                    { key: 'photo', label: 'Photo', icon: 'image' },
                                    { key: 'dlPhoto', label: 'Driving License', icon: 'file-text' },
                                    { key: 'panPhoto', label: 'PAN Card', icon: 'credit-card' },
                                    { key: 'aadharPhoto', label: 'Aadhar Card', icon: 'file' },
                                ].map((item) => (
                                    <TouchableOpacity
                                        key={item.key}
                                        style={styles.uploadBox}
                                        onPress={() => pickImage(item.key)}
                                    >
                                        {images[item.key] ? (
                                            <Image
                                                source={{ uri: images[item.key].uri }}
                                                style={styles.image}
                                            />
                                        ) : (
                                            <View style={styles.uploadContent}>
                                                <Feather
                                                    name={item.icon as any}
                                                    size={22}
                                                    color="#6b7280"
                                                    style={styles.icon}
                                                />
                                                <Text style={styles.uploadText}>{item.label}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Sticky Register Button */}
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
                    </View>
                </View>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
};

export default RegisterScreen;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    logo: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        paddingBottom: 15,
        maxHeight: '88%',
        elevation: 5,
    },
    back: {
        color: '#888',
        marginBottom: 10,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    label: {
        fontSize: 11,
        color: '#888',
        marginTop: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: '#f1f1f1',
        borderRadius: 14,
        padding: 15,
        marginTop: 6,
    },
    button: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 14,
        marginTop: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
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