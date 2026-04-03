// src/api/auth.ts
import { API_BASE_URL } from './config';

export const driverLogin = async (phone: string, password: string) => {
  const response = await fetch(
    `${API_BASE_URL}/api/driver/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({ phone, password }),
    }
  );

  return response.json();
};