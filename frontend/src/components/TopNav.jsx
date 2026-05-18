import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, Mail, ChevronDown } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { useAppContext } from '../context/AppContext';

const TopNav = () => {
  const { karma, user, darkMode } = useAppContext();

  return (
    <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} px-6 py-3 border-b flex items-center justify-between sticky top-0 z-50 transition-colors duration-200`}>
      <div className="flex items-center gap-8">
        <Link to="/dashboard" className="text-brand font-bold text-2xl tracking-tight">streamEd</Link>
        
        {/* Headless UI Dropdown */}
        <Menu as="div" className="relative hidden md:inline-block text-left">
          <Menu.Button className={`flex items-center gap-1 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} font-medium text-sm`}>
            Browse Subjects <ChevronDown size={16} />
          </Menu.Button>
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className={`absolute left-0 mt-2 w-56 origin-top-left rounded-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg border focus:outline-none`}>
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <a href="#" className={`${active ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') : (darkMode ? 'text-gray-300' : 'text-gray-700')} block px-4 py-2 text-sm`}>
                      Computer Science
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a href="#" className={`${active ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') : (darkMode ? 'text-gray-300' : 'text-gray-700')} block px-4 py-2 text-sm`}>
                      Mathematics
                    </a>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <div className="flex-1 max-w-xl px-6 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search topics, users, or live sessions..." 
            className={`w-full ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-brand/50' : 'bg-gray-100 text-gray-900 focus:ring-brand/20'} border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all`}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className={`hidden sm:block border ${darkMode ? 'border-gray-600 hover:border-brand text-gray-300' : 'border-gray-300 hover:border-brand text-gray-700'} hover:text-brand transition-colors font-medium rounded-full px-4 py-1.5 text-sm`}>
          Become a Tutor
        </button>
        <button className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} p-2`}>
          <Bell size={20} />
        </button>
        <button className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} p-2`}>
          <Mail size={20} />
        </button>
        <Menu as="div" className={`relative flex items-center gap-3 pl-4 border-l ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <Menu.Button className="flex items-center gap-3 focus:outline-none">
            <div className="flex flex-col items-end text-left hidden sm:flex">
              <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.name || user.username}</span>
              <span className="text-xs text-gray-500">Karma: {karma}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold border border-brand/20 overflow-hidden hover:opacity-80 transition-opacity">
               <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`} alt="avatar" className="w-full h-full object-cover" />
            </div>
          </Menu.Button>
          
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className={`absolute right-0 top-full mt-2 w-64 origin-top-right rounded-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-xl border focus:outline-none z-50 overflow-hidden`}>
              <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.name || user.username}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <div className="mt-2 inline-block px-2 py-1 bg-brand/10 text-brand text-xs font-bold rounded">
                  {user.role ? user.role.toUpperCase() : 'USER'}
                </div>
              </div>
              <div className="p-2">
                <Menu.Item>
                  {({ active }) => (
                    <Link to="/profile" className={`${active ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900') : (darkMode ? 'text-gray-300' : 'text-gray-700')} flex w-full items-center px-4 py-2 text-sm rounded-lg`}>
                      My Profile
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link to="/settings" className={`${active ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900') : (darkMode ? 'text-gray-300' : 'text-gray-700')} flex w-full items-center px-4 py-2 text-sm rounded-lg`}>
                      Account Settings
                    </Link>
                  )}
                </Menu.Item>
              </div>
              <div className={`p-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className={`${active ? 'bg-red-50 text-red-600' : 'text-red-500'} flex w-full items-center px-4 py-2 text-sm rounded-lg font-medium`}>
                      Sign Out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
};

export default TopNav;
