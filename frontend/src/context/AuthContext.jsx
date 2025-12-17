import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Assuming backend running on port 5000, may need proxy or env var
          const res = await axios.get('http://localhost:5000/api/users/me');
          setUser(res.data);
        } catch (error) {
          // Only log full error if it's NOT a 401 (Unauthorized)
          if (error.response?.status !== 401) {
            console.error("Error loading user", error);
          }
          
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data); // data contains user info + tokens
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', userData);
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data);
      return { success: true };
    } catch (error) {
       return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    // Optionally call backend logout to remove refresh token
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (userData) => {
      try {
          const res = await axios.put('http://localhost:5000/api/users/me', userData);
          setUser(prev => ({...prev, ...res.data}));
          return { success: true };
      } catch (error) {
          return {
              success: false,
              message: error.response?.data?.message || 'Update failed'
          };
      }
  };

  const changePassword = async (currentPassword, newPassword) => {
      try {
          await axios.put('http://localhost:5000/api/users/change-password', {
              currentPassword,
              newPassword
          });
          return { success: true };
      } catch (error) {
          return {
              success: false,
              message: error.response?.data?.message || 'Password change failed'
          };
      }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
