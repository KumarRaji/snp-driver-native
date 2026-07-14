import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../api/config';
import CustomAlert from '../components/CustomAlert';
import { Feather } from '@expo/vector-icons';
import { resetLogoutFlag } from '../api/driverApi';

const LoginScreen = () => {
    const navigation = useNavigation<any>();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [modal, setModal] = useState({ visible: false, title: '', message: '' });

    const showModal = (title: string, message: string) => setModal({ visible: true, title, message });
    const hideModal = () => setModal({ visible: false, title: '', message: '' });

    const isLoginDisabled = !phone || !password || loading;

    const handleLogin = async () => {
        if (!phone || !password) {
            showModal('Required', 'Enter phone number and password.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                'https://drivemate.api.luisant.cloud/api/driver/auth/login',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        accept: 'application/json',
                    },
                    body: JSON.stringify({
                        phone,
                        password,
                    }),
                }
            );

            const text = await response.text();
            let data: any = null;

            try {
                data = JSON.parse(text);
            } catch {
                console.error('Login API Non-JSON response:', text);
                throw new Error('Server not responding. Please try again later.');
            }

            if (response.ok) {
                // Save token and wait for it to complete
                if (data.token) {
                    try {
                        await AsyncStorage.setItem('auth-token', data.token);
                        console.log('Token saved successfully');
                    } catch (storageError) {
                        console.error('ASYNC STORAGE ERROR:', storageError);
                        showModal('Error', 'Failed to save authentication token.');
                        setLoading(false);
                        return;
                    }
                } else {
                    console.error('No token in login response');
                    showModal('Error', 'Invalid server response. Please try again.');
                    setLoading(false);
                    return;
                }

                // Navigate only after token is saved
                resetLogoutFlag();
                navigation.replace('DriverTabs');
            } else {
                let errorMessage = data.message || data.error || 'Invalid credentials';

                // Hide internal database/server errors from the user
                if (errorMessage.toLowerCase().includes('prisma') || response.status >= 500) {
                    errorMessage = 'An unexpected server error occurred. Please try again later.';
                }

                showModal('Access Denied', errorMessage);
            }
        } catch (error: any) {
            console.error("LOGIN ERROR:", error);
            const isNetworkError = error?.message?.toLowerCase().includes('fetch') || error?.message?.toLowerCase().includes('network');
            const errorTitle = isNetworkError ? 'Network Error' : 'Error';
            showModal(errorTitle, error?.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={{
                uri: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7',
            }}
            style={styles.background}
            resizeMode="cover"
            blurRadius={3}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            <View style={styles.overlay}>
                <Text style={styles.logo}>SNP</Text>

                <View style={styles.card}>
                    <Text style={styles.title}>Driver Login</Text>
                    <Text style={styles.subtitle}>
                        Enter your credentials to continue.
                    </Text>

                    <Text style={styles.label}>PHONE NUMBER</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="9876543210"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />

                    <Text style={styles.label}>PASSWORD</Text>
                    <View style={styles.passwordWrapper}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="••••••••"
                            placeholderTextColor="#999"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        {password.length > 0 && (
                            <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeButton}>
                                <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#C0C0C0" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isLoginDisabled && styles.disabledButton]}
                        onPress={handleLogin}
                        disabled={isLoginDisabled}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Login</Text>
                        )}
                    </TouchableOpacity>

                    <View style={{ alignItems: 'center', marginTop: 15 }}>
                        <Text style={{ color: '#666' }}>
                            Join as driver partner?
                        </Text>

                        <Text
                            style={styles.link}
                            onPress={() => navigation.navigate('Register')}
                        >
                            Register here
                        </Text>
                    </View>
                </View>
            </View>
            </KeyboardAvoidingView>

            <CustomAlert
                visible={modal.visible}
                title={modal.title}
                message={modal.message}
                onClose={hideModal}
            />
        </ImageBackground>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        color: '#666',
        marginBottom: 10,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#888',
        marginTop: 10,
    },
    input: {
        backgroundColor: '#f1f1f1',
        borderRadius: 10,
        padding: 15,
        marginTop: 6,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f1f1',
        borderRadius: 10,
        marginTop: 6,
    },
    passwordInput: {
        flex: 1,
        padding: 15,
    },
    eyeButton: {
        paddingHorizontal: 12,
    },
    button: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 14,
        marginTop: 20,
        alignItems: 'center',
        marginBottom: 10,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    footer: {
        textAlign: 'center',
        marginTop: 15,
        color: '#666',
    },
    link: {
        fontWeight: 'bold',
        color: '#000',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)', // 🔥 keep this
        justifyContent: 'center',
        padding: 20,
    },
    background: {
        flex: 1,
    },
    logo: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
});