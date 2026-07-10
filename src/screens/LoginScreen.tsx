import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ImageBackground,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../api/config';
import { Feather } from '@expo/vector-icons';

const LoginScreen = () => {
    const navigation = useNavigation<any>();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
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
                // Save token
                if (data.token) {
                    try {
                        await AsyncStorage.setItem('auth-token', data.token);
                    } catch (storageError) {
                        console.error("ASYNC STORAGE ERROR:", storageError);
                    }
                }

                // Navigate
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
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#999"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

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

            <Modal visible={modal.visible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Feather name="alert-triangle" size={48} color="#fff" />
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={styles.modalTitle}>{modal.title}</Text>
                            <Text style={styles.modalMessage}>{modal.message}</Text>
                            <TouchableOpacity style={styles.modalButton} onPress={hideModal}>
                                <Text style={styles.modalButtonText}>Okay, Understood</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '78%',
        backgroundColor: '#fff',
        borderRadius: 18,
        overflow: 'hidden',
        elevation: 12,
    },
    modalHeader: {
        backgroundColor: '#EF4444',
        paddingVertical: 20,
        alignItems: 'center',
    },
    modalBody: {
        padding: 16,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 18,
    },
    modalButton: {
        backgroundColor: '#000',
        width: '100%',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});