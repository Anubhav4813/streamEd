import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Video, Search as SearchIcon, Calendar, BookOpen, Users, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const SidebarItem = ({ icon, label, to, currentPath }) => {
  const { darkMode } = useAppContext();
  const active = currentPath === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active ? (darkMode ? 'bg-brand/20 text-indigo-300' : 'bg-brand/10 text-brand') : (darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}`}>
      {icon}
      {label}
    </Link>
  );
};

const Sidebar = () => {
  const { darkMode, logout } = useAppContext();
  const location = useLocation();

  return (
    <aside className={`hidden lg:flex w-64 flex-col p-4 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-100'} border-r sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto transition-colors duration-200`}>
      <nav className="space-y-1 flex-1">
        <SidebarItem icon={<Home size={20} />} label="Dashboard" to="/dashboard" currentPath={location.pathname} />
        <SidebarItem icon={<Video size={20} />} label="Live Streams" to="/watch" currentPath={location.pathname} />
        <SidebarItem icon={<Video size={20} />} label="Host Live" to="/host" currentPath={location.pathname} />
        <SidebarItem icon={<SearchIcon size={20} />} label="Find a Peer" to="/peers" currentPath={location.pathname} />
        <SidebarItem icon={<Calendar size={20} />} label="My Schedule" to="/schedule" currentPath={location.pathname} />
        <SidebarItem icon={<BookOpen size={20} />} label="Subjects" to="/subjects" currentPath={location.pathname} />
        <SidebarItem icon={<Users size={20} />} label="Community" to="/community" currentPath={location.pathname} />

      </nav>
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button 
          onClick={logout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'text-red-400 hover:bg-gray-800 hover:text-red-300' : 'text-red-600 hover:bg-red-50'}`}
        >
          <LogOut size={20} />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
