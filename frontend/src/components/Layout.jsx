import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Video, User, Search as SearchIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';

const Layout = ({ children }) => {
  const { darkMode } = useAppContext();
  const location = useLocation();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'} flex flex-col font-sans transition-colors duration-200`}>
      <TopNav />

      <div className="flex flex-1 max-w-[1600px] w-full mx-auto">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Right Sidebar (Quick Actions) */}
        {location.pathname !== '/host' && location.pathname !== '/watch' && (
          <RightPanel />
        )}
      </div>

      {/* Mobile Bottom Navigation — hidden on live stream pages where chat needs the space */}
      {!location.pathname.startsWith('/watch/') && location.pathname !== '/host' && (
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t flex justify-around p-3 z-50 transition-colors duration-200`}>
         <Link to="/dashboard" className="flex flex-col items-center"><Home size={24} className={location.pathname === '/dashboard' ? 'text-brand' : 'text-gray-400'} /><span className={`text-[10px] mt-1 font-medium ${location.pathname === '/dashboard' ? 'text-brand' : 'text-gray-400'}`}>Home</span></Link>
         <Link to="/watch" className="flex flex-col items-center"><Video size={24} className={location.pathname === '/watch' ? 'text-brand' : 'text-gray-400'} /><span className={`text-[10px] mt-1 font-medium ${location.pathname === '/watch' ? 'text-brand' : 'text-gray-400'}`}>Watch</span></Link>
         <Link to="/peers" className="flex flex-col items-center"><SearchIcon size={24} className={location.pathname === '/peers' ? 'text-brand' : 'text-gray-400'} /><span className={`text-[10px] mt-1 font-medium ${location.pathname === '/peers' ? 'text-brand' : 'text-gray-400'}`}>Peers</span></Link>
         <Link to="/profile" className="flex flex-col items-center"><User size={24} className={location.pathname === '/profile' ? 'text-brand' : 'text-gray-400'} /><span className={`text-[10px] mt-1 font-medium ${location.pathname === '/profile' ? 'text-brand' : 'text-gray-400'}`}>Profile</span></Link>
      </nav>
      )}
    </div>
  );
};

export default Layout;
