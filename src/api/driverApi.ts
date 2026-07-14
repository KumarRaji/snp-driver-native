import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const BASE_URL = 'https://drivemate.api.luisant.cloud/api';
let isLoggingOut = false;

export const resetLogoutFlag = () => {
  isLoggingOut = false;
};

const getHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('auth-token');
    if (!token) {
      console.warn('No auth token found in AsyncStorage');
      return null;
    }

    console.log('Token retrieved:', token.substring(0, 20) + '...');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.error('Error reading auth token:', error);
    return null;
  }
};

// 🔥 GLOBAL API CALL WRAPPER (Handles Deactivation & Errors)
export const apiCall = async (url: string, options: any = {}, retryCount = 0): Promise<any> => {
  const MAX_RETRIES = 2;
  const headers = await getHeaders();
  if (!headers) {
    console.warn('No auth headers available for API call to:', url);
    return {
      logout: true,
      message: 'Please login again.',
    };
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    console.log('API:', url, 'Status:', res.status);
    console.log('Raw Response:', text.substring(0, 500));

    try {
      const data = JSON.parse(text);
      console.log('Parsed Response:', data);

      // Detect deactivated or unauthorized states
      const isDeactivated =
        data?.status === 'INACTIVE' ||
        (typeof data?.message === 'string' && data.message.toLowerCase().includes('deactivated'));

      if (isDeactivated) {
        return { logout: true, message: 'Your account has been deactivated by admin. Please contact support.' };
      }

      // Only logout on specific, known token errors
      const isTokenError =
        data?.error === 'Access token required' ||
        data?.error === 'Invalid token' ||
        data?.error === 'Token expired' ||
        (typeof data?.message === 'string' && (
          data.message.toLowerCase().includes('invalid token') ||
          data.message.toLowerCase().includes('access token') ||
          data.message.toLowerCase().includes('token expired') ||
          data.message.toLowerCase().includes('jwt expired') ||
          data.message.toLowerCase().includes('unauthorized') ||
          data.message.toLowerCase().includes('authentication failed')
        ));

      // Retry on 403 with "Invalid token" (transient backend issue)
      if (res.status === 403 && isTokenError && retryCount < MAX_RETRIES) {
        console.warn(`Retrying ${url} (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return apiCall(url, options, retryCount + 1);
      }

      // Only logout if we have a clear token error AND 401/403 after retries
      if (isTokenError && (res.status === 401 || res.status === 403)) {
        console.error('Token error detected:', { isTokenError, status: res.status, error: data?.error, message: data?.message });
        return { logout: true, message: data?.message || 'Your session expired. Please login again.' };
      }

      // For other 401/403 errors, return them as normal errors (not logout)
      if (res.status === 401 || res.status === 403) {
        return { error: true, message: data?.message || 'Authentication error. Please try again.' };
      }

      return data;
    } catch {
      // HTML response (server error, account blocked, or gateway issue)
      // Do not force logout on temporary server errors (500/502/503) caused by fast tab switching
      if (res.status === 401 || res.status === 403) {
        // If we can't parse JSON but got 401/403, it's likely a server issue
        return { error: true, message: 'Temporary authentication issue. Please try again.' };
      }
      if (res.status >= 500) {
        console.error('Server error on', url, '- not logging out');
        return { error: true, message: 'Server error. Please try again later.' };
      }
      return { error: true, message: 'Server not responding. Please try again later.' };
    }
  } catch (error) {
    console.error('API Network Error:', error);
    return { error: true, message: 'Server not responding. Please check your connection.' };
  }
};

export const handleLogoutIfRequired = async (data: any, navigation: any) => {
  if (!data?.logout) return false;

  if (isLoggingOut) return true;
  isLoggingOut = true;

  const isDeactivated =
    data.message?.toLowerCase().includes('deactivated') ||
    data.message?.toLowerCase().includes('contact support');

  Alert.alert(
    isDeactivated ? 'Account Disabled' : 'Session Expired',
    data.message || 'Your session expired. Please login again.',
    [
      {
        text: 'OK',
        onPress: async () => {
          await AsyncStorage.removeItem('auth-token');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ],
    {
      cancelable: false,
    }
  );

  return true;
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
export const completeTripAPI = (id: string, body: any) =>
  apiCall(`${BASE_URL}/trips/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

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
