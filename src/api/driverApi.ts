import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const BASE_URL = 'https://drivemate.api.luisant.cloud/api';
let isLoggingOut = false;

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('auth-token');
  if (!token) return null;

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// 🔥 GLOBAL API CALL WRAPPER (Handles Deactivation & Errors)
export const apiCall = async (url: string, options: any = {}) => {
  const headers = await getHeaders();
  if (!headers) return { logout: true };

  try {
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();

    try {
      const data = JSON.parse(text);

      // Detect deactivated or unauthorized states
      const isTokenError =
        data?.error === 'Access token required' ||
        data?.error === 'Invalid token' ||
        (typeof data?.message === 'string' && data.message.toLowerCase().includes('invalid token'));

      const isDeactivated =
        data?.status === 'INACTIVE' ||
        (typeof data?.message === 'string' && data.message.toLowerCase().includes('deactivated'));

      if (isDeactivated) {
        return { logout: true, message: 'Your account has been deactivated by admin. Please contact support.' };
      }

      if (isTokenError && (res.status === 401 || res.status === 403)) {
        return { logout: true, message: data?.message || 'Your session expired. Please login again.' };
      }

      return data;
    } catch {
      // HTML response (server error, account blocked, or gateway issue)
          // Do not force logout on temporary server errors (500/502/503) caused by fast tab switching
          return { error: true, message: 'Server not responding. Please try again later.' };
    }
  } catch (error) {
    console.error('API Network Error:', error);
        return { error: true, message: 'Server not responding. Please check your connection.' };
  }
};

export const handleLogoutIfRequired = async (data: any, navigation: any) => {
  if (data?.logout) {
    // Prevent multiple logout alerts
    if (isLoggingOut) return true;
    isLoggingOut = true;

    Alert.alert(
      'Account Disabled',
      data.message || 'Your account has been deactivated by admin or your session expired. Please contact support.',
      [
        {
          text: 'OK',
          onPress: async () => {
            await AsyncStorage.removeItem('auth-token');
            isLoggingOut = false;
            navigation.replace('Login');
          },
        },
      ]
    );
    return true;
  }
  return false;
};

// 👤 Profile
export const getProfile = () => apiCall(`${BASE_URL}/auth/profile`);

// 🗑️ Delete Account
export const deleteAccount = async () => {
  const headers = await getHeaders();
  if (!headers) return { logout: true };

  const endpoints = [
    `${BASE_URL}/auth/delete`,
    `${BASE_URL}/auth/delete-account`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { method: 'DELETE', headers });
      const text = await res.text();

      try {
        const data = JSON.parse(text);
        if (res.ok) return data;
        if (res.status !== 404) return data;
      } catch {
        if (res.ok) {
          return { success: true, message: 'Account deleted successfully.' };
        }
        if (res.status !== 404) {
          return { error: true, message: 'Unable to delete account. Please try again later.' };
        }
      }
    } catch (error) {
      console.error('Delete account error:', error);
    }
  }

  return { error: true, message: 'Unable to delete account. Please contact support.' };
};

// 📦 Packages
export const getPackages = () => apiCall(`${BASE_URL}/subscriptions/active-packages`);

// 👤 Subscription
export const getSubscription = () => apiCall(`${BASE_URL}/subscriptions/driver`);

// 🚗 Trips
export const getTrips = () => apiCall(`${BASE_URL}/trips/driver`);

// 📥 Booking Requests
export const getRequests = () => apiCall(`${BASE_URL}/booking-workflow/driver/pending-requests`);

//purchage subscription
export const purchaseSubscription = (planId: string, paymentMethod: string) =>
  apiCall(`${BASE_URL}/subscriptions/purchase`, {
    method: 'POST',
    body: JSON.stringify({ planId, paymentMethod }),
  });

export const getActiveSubscription = () => apiCall(`${BASE_URL}/subscriptions/driver`);

// 📋 Driver Bookings
export const getDriverBookings = () => apiCall(`${BASE_URL}/bookings/driver-bookings`);

// ✅ Accept / Reject
export const respondRequest = (id: string, action: string) =>
  apiCall(`${BASE_URL}/booking-workflow/driver/respond/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ action }),
  });

// 🏁 Complete Trip
export const completeTripAPI = (id: string) =>
  apiCall(`${BASE_URL}/trips/${id}/complete`, { method: 'POST' });

// 🚀 Send Start OTP
export const sendStartOTP = (id: string) =>
  apiCall(`${BASE_URL}/trips/${id}/send-start-otp`, { method: 'POST' });

// ✅ Start Trip (verify OTP)
export const startTripAPI = (id: string, otp: string) =>
  apiCall(`${BASE_URL}/trips/${id}/start`, {
    method: 'POST',
    body: JSON.stringify({ otp }),
  });

// ❌ Request Cancel
export const requestCancelAPI = (id: string) =>
  apiCall(`${BASE_URL}/trips/${id}/request-cancel`, { method: 'POST' });