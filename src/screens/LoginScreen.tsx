import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

const API_BASE_URL = "https://makecallsnp.com"; // change if needed

interface Props {
  navigation: any;
  onLogin: (user: any) => void;
}

const LoginScreen: React.FC<Props> = ({ navigation, onLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/driver/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (res.ok) {
        onLogin({ ...data.driver, role: 'DRIVER' });
      } else {
        Alert.alert('Error', data.message || 'Invalid credentials');
      }
    } catch (err) {
      Alert.alert('Error', 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Login</Text>
      <Text style={styles.subtitle}>Enter your credentials</Text>

      <TextInput
        placeholder="Phone Number"
        style={styles.input}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
      </TouchableOpacity>

      <Text style={styles.link}>
        Join as driver partner?{' '}
        <Text
          style={styles.register}
          onPress={() => navigation.navigate('Register')}
        >
          Register here
        </Text>
      </Text>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: 'gray', marginBottom: 20 },
  input: {
    backgroundColor: '#f1f1f1',
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: 'black',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
  link: { textAlign: 'center', marginTop: 15 },
  register: { fontWeight: 'bold' },
});