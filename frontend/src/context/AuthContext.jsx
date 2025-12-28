import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
      const t = localStorage.getItem('token');
      if (t) api.defaults.headers.common['Authorization'] = `Token ${t}`;
      return t;
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Token ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
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
