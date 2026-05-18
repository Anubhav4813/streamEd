import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [karma, setKarma] = useState(789);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [token, setTokenState] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(() => !localStorage.getItem('token'));

  const setToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
    setTokenState(newToken);
    setAuthChecked(!newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // Fetch current user if token exists
  useEffect(() => {
    if (!token) {
      return;
    }

    if (user) {
      return;
    }

    const controller = new AbortController();

    fetch('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      signal: controller.signal
    })
      .then(async res => {
        if (!res.ok) {
          throw new Error(`Auth check failed (${res.status})`);
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Invalid auth response format');
        }

        return res.json();
      })
      .then(data => {
        if (!data?.user) {
          throw new Error('Invalid user payload');
        }

        setUser({
          ...data.user,
          avatar: 'https://ui-avatars.com/api/?name=' + data.user.username,
          role: data.user.role || 'user',
          rating: data.user.rating ?? 5.0
        });

        if (data.user.karma !== undefined) {
          setKarma(data.user.karma);
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.warn('Auth bootstrap failed, clearing stale session token.', err.message);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAuthChecked(true);
        }
      });

    return () => controller.abort();
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
      token, setToken, logout,
      authChecked
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
