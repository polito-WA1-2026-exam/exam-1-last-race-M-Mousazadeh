import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/API';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on application mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const currentUser = await API.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        // Not logged in or expired session is normal, keep user null
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const loginHandler = async (username, password) => {
    setLoading(true);
    try {
      const loggedUser = await API.login(username, password);
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logoutHandler = async () => {
    setLoading(true);
    try {
      await API.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login: loginHandler, logout: logoutHandler }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to consume authentication details
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
