import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name?: string;
  created_at: string;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const API_URL = '/api';

export const useAuthStore = create<AuthStore>()(persist(
  (set) => ({
    token: null,
    user: null,
    
    login: async (email: string, password: string) => {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      set({ token: response.data.access_token, user: response.data.user });
    },
    
    register: async (username: string, email: string, password: string) => {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
      });
      set({ token: response.data.access_token, user: response.data.user });
    },
    
    logout: () => {
      set({ token: null, user: null });
    },
  }),
  { name: 'auth-store' }
));