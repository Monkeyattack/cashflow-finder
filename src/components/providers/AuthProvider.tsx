'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ApiResponse, AuthContext as AuthContextType } from '@/types';

interface AuthState {
  user: User | null;
  authContext: AuthContextType | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextProps extends AuthState {
  login: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTH_CONTEXT'; payload: AuthContextType | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_AUTH' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_AUTH_CONTEXT':
      return { ...state, authContext: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_AUTH':
      return { ...state, user: null, authContext: null, error: null };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  authContext: null,
  loading: true,
  error: null,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      dispatch({ type: 'SET_USER', payload: user });
      
      if (user) {
        try {
          const idToken = await user.getIdToken();
          await authenticateWithBackend(idToken);
        } catch (error) {
          console.error('Authentication error:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Authentication failed' });
        }
      } else {
        dispatch({ type: 'CLEAR_AUTH' });
        localStorage.removeItem('authToken');
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    return unsubscribe;
  }, []);

  const authenticateWithBackend = async (idToken: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const result: ApiResponse<{ token: string; user: AuthContextType }> = await response.json();

      if (result.success && result.data) {
        const { token, user } = result.data;
        localStorage.setItem('authToken', token);
        dispatch({ type: 'SET_AUTH_CONTEXT', payload: user });
        dispatch({ type: 'SET_ERROR', payload: null });
      } else {
        throw new Error(result.error?.message || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('Backend authentication error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const login = async (idToken: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await authenticateWithBackend(idToken);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('authToken');
      dispatch({ type: 'CLEAR_AUTH' });
    } catch (error: any) {
      console.error('Logout error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const refreshAuth = async () => {
    if (state.user) {
      try {
        const idToken = await state.user.getIdToken(true);
        await authenticateWithBackend(idToken);
      } catch (error: any) {
        console.error('Refresh auth error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    }
  };

  const value: AuthContextProps = {
    ...state,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};