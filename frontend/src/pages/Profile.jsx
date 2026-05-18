import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Mail, Calendar, Award, BookOpen, Video, Users, Clock, Shield, Star, Edit3, Check, X } from 'lucide-react';

const Profile = () => {
  const { user, setUser, karma, darkMode, logout, token } = useAppContext();

  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(user?.bio || '');
  const [savingBio, setSavingBio] = useState(false);
  const [bioError, setBioError] = useState('');

  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

  const stats = [
    { label: 'Hours Studied', value: '142', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Streams Hosted', value: '12', icon: Video, color: 'text-brand', bg: 'bg-brand/10' },
    { label: 'Study Groups', value: '34', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Subjects', value: '5', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const badges = [
    { name: 'Top Contributor', icon: Award, color: 'text-amber-500' },
    { name: '5.0 Rating', icon: Star, color: 'text-emerald-500' },
    { name: 'Early Adopter', icon: Shield, color: 'text-brand' },
  ];

  const saveBio = async () => {
    setSavingBio(true);
    setBioError('');
    try {
      const res = await fetch('/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ bio: bioValue })
      });
      const data = await res.json();
      if (data.user) {
        setUser(prev => ({ ...prev, bio: data.user.bio }));
        setEditingBio(false);
      } else {
        setBioError('Failed to save. Try again.');
      }
    } catch {
      setBioError('Network error. Try again.');
    } finally {
      setSavingBio(false);
    }
  };

  const cancelBio = () => {
    setBioValue(user?.bio || '');
    setBioError('');
    setEditingBio(false);
  };

  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} pb-12`}>
      {/* Cover */}
      <div className="h-56 bg-gradient-to-r from-brand via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">

        {/* Hero Card */}
        <div className={`${card} rounded-3xl shadow-xl p-8 border mb-8`}>
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">

            {/* Avatar */}
            <div
              className="relative rounded-full shadow-lg shrink-0"
              onMouseEnter={() => setIsHoveringAvatar(true)}
              onMouseLeave={() => setIsHoveringAvatar(false)}
            >
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&size=160`}
                className="w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-white object-cover"
                alt="Profile"
              />
              {isHoveringAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center cursor-pointer">
                  <Edit3 className="text-white" size={22} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold mb-1 tracking-tight">{user?.name || user?.username}</h1>
              <p className={`text-base mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Mail size={16} /> {user?.email}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                  <Shield size={14} /> {user?.role || 'USER'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand/10 text-brand border border-brand/20 flex items-center gap-1">
                  <Award size={14} /> {karma} Karma
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Star size={14} fill="currentColor" /> {user?.rating?.toFixed(1) || '5.0'} Rating
                </span>
              </div>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: About + Badges */}
          <div className="space-y-6">

            {/* About Me */}
            <div className={`${card} rounded-2xl p-6 shadow-sm border`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BookOpen size={18} className="text-brand" /> About Me
                </h3>
                {!editingBio && (
                  <button
                    onClick={() => { setBioValue(user?.bio || ''); setEditingBio(true); }}
                    className={`p-1.5 rounded-lg hover:bg-brand/10 text-brand transition-colors`}
                    title="Edit bio"
                  >
                    <Edit3 size={16} />
                  </button>
                )}
              </div>

              {editingBio ? (
                <div>
                  <textarea
                    className={`w-full rounded-xl px-4 py-3 text-sm resize-none border focus:outline-none focus:ring-2 focus:ring-brand transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                    rows={5}
                    maxLength={300}
                    placeholder="Tell the community a little about yourself — your subjects, goals, or interests..."
                    value={bioValue}
                    onChange={e => setBioValue(e.target.value)}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{bioValue.length}/300</span>
                    {bioError && <span className="text-xs text-red-500">{bioError}</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={saveBio}
                      disabled={savingBio}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brand text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
                    >
                      {savingBio ? 'Saving...' : <><Check size={15} /> Save</>}
                    </button>
                    <button
                      onClick={cancelBio}
                      disabled={savingBio}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold border transition-colors ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      <X size={15} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {user?.bio ? (
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{user.bio}</p>
                  ) : (
                    <p className={`text-sm italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      No bio yet. Click the edit icon to tell the community about yourself!
                    </p>
                  )}
                  <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex items-center gap-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Calendar size={14} /> Joined October 2026
                  </div>
                </>
              )}
            </div>

            {/* Badges */}
            <div className={`${card} rounded-2xl p-6 shadow-sm border`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Award size={18} className="text-brand" /> Badges
              </h3>
              <div className="space-y-3">
                {badges.map((badge, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors`}>
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm ${badge.color}`}>
                      <badge.icon size={18} />
                    </div>
                    <span className="font-semibold text-sm">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right: Stats + Activity */}
          <div className="lg:col-span-2 space-y-6">

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <div key={idx} className={`${card} p-5 rounded-2xl shadow-sm border flex flex-col items-center text-center hover:-translate-y-1 transition-transform`}>
                  <div className={`w-11 h-11 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center mb-2`}>
                    <stat.icon size={22} />
                  </div>
                  <h4 className="text-2xl font-extrabold">{stat.value}</h4>
                  <p className="text-xs text-gray-500 uppercase font-semibold mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className={`${card} rounded-2xl p-6 shadow-sm border`}>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Clock size={18} className="text-brand" /> Recent Activity
              </h3>
              <div className="space-y-6">
                {[
                  { title: 'Hosted "Advanced Data Structures in JS"', time: '2 days ago', type: 'Stream', icon: Video, color: 'text-brand' },
                  { title: 'Joined Peer Study for Linear Algebra', time: '5 days ago', type: 'Study', icon: Users, color: 'text-emerald-500' },
                  { title: 'Earned "Top Contributor" badge', time: '1 week ago', type: 'Achievement', icon: Award, color: 'text-amber-500' },
                ].map((item, idx, arr) => (
                  <div key={idx} className="flex gap-4 relative">
                    {idx !== arr.length - 1 && (
                      <div className={`absolute left-6 top-10 bottom-[-24px] w-0.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    )}
                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 z-10 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <item.icon size={18} className={item.color} />
                    </div>
                    <div className="pt-2">
                      <p className="font-bold text-sm leading-tight mb-1">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.type} • {item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className={`w-full mt-6 py-2.5 rounded-xl font-semibold text-sm border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                View Full History
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
