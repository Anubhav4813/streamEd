import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LiveStreams from './pages/LiveStreams';
import ViewStream from './pages/ViewStream';
import HostLive from './pages/HostLive';
import FindPeer from './pages/FindPeer';
import Schedule from './pages/Schedule';
import Subjects from './pages/Subjects';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Layout from './components/Layout';
import { AppProvider, useAppContext } from './context/AppContext';

const ProtectedRoute = ({ children }) => {
  const { token, user, authChecked } = useAppContext();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Show loading while validating saved token
  if (!authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/watch" element={<ProtectedRoute><LiveStreams /></ProtectedRoute>} />
      <Route path="/watch/:roomId" element={<ProtectedRoute><ViewStream /></ProtectedRoute>} />
      <Route path="/host" element={<ProtectedRoute><HostLive /></ProtectedRoute>} />
      <Route path="/peers" element={<ProtectedRoute><FindPeer /></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
      <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
