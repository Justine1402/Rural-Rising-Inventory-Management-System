import { createContext, useContext, useEffect, useState } from 'react';
import api, { getCsrfCookie } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/user')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    await getCsrfCookie();
    const res = await api.post('/login', { email, password });
    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (_) {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
