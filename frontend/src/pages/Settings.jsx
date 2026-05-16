import React from 'react';
import { useAppContext } from '../context/AppContext';

const Settings = () => {
  const { darkMode, toggleDarkMode, notificationsEnabled, setNotificationsEnabled } = useAppContext();

  return (
    <div className={`p-6 lg:p-8 max-w-3xl mx-auto ${darkMode ? 'text-white' : ''}`}>
      <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Settings</h2>
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700 divide-gray-700' : 'bg-white border-gray-100 divide-gray-100'} rounded-xl shadow-sm border divide-y transition-colors duration-200`}>
         <div className="p-6 flex justify-between items-center">
            <div>
               <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Email Notifications</h4>
               <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Get updates about upcoming sessions.</p>
            </div>
            <input 
               type="checkbox" 
               className="w-5 h-5 accent-brand cursor-pointer" 
               checked={notificationsEnabled} 
               onChange={(e) => setNotificationsEnabled(e.target.checked)} 
            />
         </div>
         <div className="p-6 flex justify-between items-center">
            <div>
               <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Dark Mode</h4>
               <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Toggle dark theme across the platform.</p>
            </div>
            <input 
               type="checkbox" 
               className="w-5 h-5 accent-brand cursor-pointer" 
               checked={darkMode} 
               onChange={toggleDarkMode} 
            />
         </div>
      </div>
    </div>
  );
};
export default Settings;
