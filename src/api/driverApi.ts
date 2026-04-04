import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://drivemate.api.luisant.cloud/api';

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('auth-token');

  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// 📦 Packages
export const getPackages = async () => {
  const res = await fetch(`${BASE_URL}/subscriptions/active-packages`);
  return res.json();
};

// 👤 Subscription
export const getSubscription = async () => {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}/subscriptions/driver`, { headers });
  return res.json();
};

// 🚗 Trips
export const getTrips = async () => {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}/trips/driver`, { headers });
  return res.json();
};

// 📥 Booking Requests
export const getRequests = async () => {
  const headers = await getHeaders();
  const res = await fetch(
    `${BASE_URL}/booking-workflow/driver/pending-requests`,
    { headers }
  );
  return res.json();
};

// 📋 Driver Bookings
export const getDriverBookings = async () => {
  const headers = await getHeaders();
  const res = await fetch(
    `${BASE_URL}/bookings/driver-bookings`,
    { headers }
  );
  return res.json();
};

// ✅ Accept / Reject
export const respondRequest = async (id: string, action: string) => {
  const headers = await getHeaders();

  const res = await fetch(
    `${BASE_URL}/booking-workflow/driver/respond/${id}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ action }),
    }
  );

  return res.json();
};