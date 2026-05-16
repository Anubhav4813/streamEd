import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const RightPanel = () => {
  const { darkMode, incrementKarma } = useAppContext();
  const location = useLocation();
  const isLiveStreamPage = location.pathname.startsWith('/watch/') || location.pathname === '/host';

  const friends = [];

  return (
    <aside className={`hidden xl:block w-80 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-l sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto transition-colors duration-200`}>
      {/* Quick Actions */}
      {!isLiveStreamPage && (
        <div className="mb-8">
        <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider mb-4`}>QUICK ACTIONS</p>
        <div className="space-y-3">
          <Link to="/schedule" className={`w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500' : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300'} border font-medium py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2`}>
            Start a Study Group
          </Link>
          <Link to="/host" onClick={() => incrementKarma(10)} className="w-full bg-brand-green text-white font-bold py-3 px-4 rounded-xl shadow-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
            Go Live Now
          </Link>
          <Link to="/peers" className={`w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500' : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300'} border font-medium py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2`}>
            Find a Tutor
          </Link>
        </div>
      </div>
      )}

      {/* Online Friends */}
      <div>
        <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider mb-4`}>ONLINE FRIENDS</p>
        <ul className="space-y-4">
          {friends.length === 0 && <li className="text-sm text-gray-500 italic">No friends online right now.</li>}
          {friends.map((friend, i) => (
            <li key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-gray-700 border-gray-800' : 'bg-gray-200 border-white'} border-2 overflow-hidden`}>
                    <img src={`https://i.pravatar.cc/150?u=${friend.name}`} alt={friend.name} className="w-full h-full object-cover" />
                  </div>
                  {friend.active && <div className={`absolute bottom-0 right-0 w-3 h-3 bg-brand-green border-2 ${darkMode ? 'border-gray-800' : 'border-white'} rounded-full`}></div>}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{friend.name}</p>
                  <p className="text-xs text-gray-500">Karma: {friend.karma}</p>
                </div>
              </div>
              {friend.active && <span className="text-xs font-medium text-brand-green">Active</span>}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default RightPanel;
