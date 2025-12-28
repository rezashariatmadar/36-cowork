import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // In a real app, we might verify token or fetch user profile here
      // For now, we assume if token exists, user is logged in.
      // We can decode user info if using JWT, or just store user object in localStorage too.
      // Let's assume we store user basic info or just rely on token.
      api.defaults.headers.common['Authorization'] = `Token ${token}`;
      setLoading(false);
    } else {
        delete api.defaults.headers.common['Authorization'];
        setLoading(false);
    }
  }, [token]);

  const login = async (mobile, password) => {
    try {
      const response = await api.post('/token-auth/', { username: mobile, password });
      const newToken = response.data.token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      api.defaults.headers.common['Authorization'] = `Token ${newToken}`;
      return true;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const registerUser = async (userData) => {
      try {
          await api.post('/auth/register/', userData);
          // Auto login after register? Or redirect to login.
          // Let's return true and redirect to login
          return true;
      } catch (error) {
          console.error("Registration failed", error);
          throw error;
      }
  }

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, registerUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
