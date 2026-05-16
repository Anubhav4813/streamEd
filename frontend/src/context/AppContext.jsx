import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [karma, setKarma] = useState(789);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [token, setTokenState] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);

  const setToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
    setTokenState(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // Fetch current user if token exists
  useEffect(() => {
    if (token && !user) {
      fetch('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          setToken(null);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        if (data.user) {
          setUser({
            ...data.user,
            avatar: 'https://ui-avatars.com/api/?name=' + data.user.username,
            role: data.user.role || 'user',
            rating: data.user.rating ?? 5.0
          });
          if (data.user.karma !== undefined) {
            setKarma(data.user.karma);
          }
        }
      })
      .catch(err => {
        // Network error (e.g. backend not ready) — keep token, don't log out
        console.warn('Could not reach auth server, will retry on next action.', err.message);
      });
    }
  }, [token, user]);

  // Load settings from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Handle Dark Mode toggle
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  const incrementKarma = async (amount = 10) => {
    setKarma(prev => prev + amount);
    if (token) {
      try {
        const res = await fetch('/auth/karma', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ amount })
        });
        const data = await res.json();
        if (data.karma !== undefined) {
          setKarma(data.karma);
        }
      } catch (err) {
        console.error("Failed to sync karma:", err);
      }
    }
  };

  return (
    <AppContext.Provider value={{
      karma, incrementKarma,
      darkMode, toggleDarkMode,
      notificationsEnabled, setNotificationsEnabled,
      user, setUser,
      token, setToken, logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
