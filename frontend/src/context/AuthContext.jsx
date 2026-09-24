import { createContext, useContext, useEffect, useState } from 'react';
import api, { clearAuthToken, setAuthToken } from '../api';

const AuthContext = createContext(null);
const REMEMBER_EMAIL_KEY = 'fgc_remember_email';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const signin = async (email, password, rememberMe = false) => {
    const { data } = await api.post('/auth/signin', { email, password, rememberMe });
    setAuthToken(data.token, rememberMe);
    if (rememberMe) localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    else localStorage.removeItem(REMEMBER_EMAIL_KEY);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signin, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { REMEMBER_EMAIL_KEY };
