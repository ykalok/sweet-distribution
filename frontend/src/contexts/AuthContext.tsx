import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '../lib/api';

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'ADMIN';
  companyName: string | null;
}

interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, companyName?: string) => Promise<void>;
  signOut: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const saved = localStorage.getItem('user_profile');
    if (token && saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_profile');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    const res = data.data;
    localStorage.setItem('jwt_token', res.token);
    const p: Profile = {
      id: res.userId,
      email: res.email,
      fullName: res.fullName,
      role: res.role,
      companyName: res.companyName ?? null,
    };
    localStorage.setItem('user_profile', JSON.stringify(p));
    setProfile(p);
  };

  const signUp = async (email: string, password: string, fullName: string, companyName?: string) => {
    const { data } = await authApi.register({ email, password, fullName, companyName });
    const res = data.data;
    localStorage.setItem('jwt_token', res.token);
    const p: Profile = {
      id: res.userId,
      email: res.email,
      fullName: res.fullName,
      role: res.role,
      companyName: res.companyName ?? null,
    };
    localStorage.setItem('user_profile', JSON.stringify(p));
    setProfile(p);
  };

  const signOut = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_profile');
    setProfile(null);
  };

  const isAdmin = profile?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signUp, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
