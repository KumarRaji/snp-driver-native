import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const BASE_URL = 'https://drivemate.api.luisant.cloud/api';

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
      if (
        data?.error === 'Access token required' ||
        data?.status === 'INACTIVE' ||
        res.status === 401 ||
        res.status === 403
      ) {
        let msg = data?.error || data?.message || 'Your session expired. Please login again.';
        if (typeof msg === 'string' && msg.toLowerCase().includes('deactivated')) {
          msg = 'Your account has been deactivated by admin. Please contact support.';
        }
        return { logout: true, message: msg };
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
    Alert.alert(
      'Account Disabled',
      data.message || 'Your account has been deactivated by admin or your session expired. Please contact support.',
      [
        {
          text: 'OK',
          onPress: async () => {
            await AsyncStorage.removeItem('auth-token');
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