import React, { useState, useMemo } from 'react';
import { 
  Search, MapPin, Star, UserPlus, Check, 
  Sparkles, Code, Calculator, Globe, Atom, BookOpen 
} from 'lucide-react';

// Data is fetched from API

const CATEGORIES = [
  { id: 'All', label: 'All Subjects', icon: <BookOpen size={16} /> },
  { id: 'Engineering', label: 'Engineering & CS', icon: <Code size={16} /> },
  { id: 'Mathematics', label: 'Mathematics', icon: <Calculator size={16} /> },
  { id: 'Science', label: 'Science', icon: <Atom size={16} /> },
  { id: 'Languages', label: 'Languages', icon: <Globe size={16} /> },
];

const FindPeer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [requestedPeers, setRequestedPeers] = useState(new Set());
  const [peersData, setPeersData] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/peers')
      .then(res => res.json())
      .then(data => {
        setPeersData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Filter peers based on search query and category
  const filteredPeers = useMemo(() => {
    return peersData.filter(peer => {
      const matchesCategory = activeCategory === 'All' || peer.category === activeCategory;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        peer.name.toLowerCase().includes(searchLower) ||
        peer.bio.toLowerCase().includes(searchLower) ||
        peer.major.toLowerCase().includes(searchLower) ||
        peer.strongIn.some(s => s.toLowerCase().includes(searchLower)) ||
        peer.needsHelpWith.some(s => s.toLowerCase().includes(searchLower));
      
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory, peersData]);

  const handleConnect = (peerId) => {
    setRequestedPeers(prev => {
      const newSet = new Set(prev);
      newSet.add(peerId);
      return newSet;
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header Section */}
      <div className="mb-10 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 text-brand rounded-full text-sm font-semibold mb-4">
          <Sparkles size={16} />
          <span>Match with your perfect study buddy</span>
        </div>
        <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Find a Study Peer</h2>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto md:mx-0">
          Connect with students on your campus who share your learning goals, complement your skills, and want to succeed together.
        </p>
      </div>

      {/* Controls Section: Search & Filters */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 mb-10 sticky top-4 z-10">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand transition-colors" size={22} />
            <input 
              type="text" 
              placeholder="Search by name, subject, topic, or skill..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all duration-300"
            />
          </div>
        </div>

        {/* Categories / Tabs */}
        <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-3">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`whitespace-nowrap flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeCategory === category.id 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category.icon}
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading peers...</p>
        </div>
      ) : filteredPeers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-gray-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No peers found</h3>
          <p className="text-gray-500">We couldn't find anyone matching your current filters. Try adjusting your search.</p>
          <button 
            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
            className="mt-6 text-brand font-semibold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredPeers.map((peer) => (
            <PeerCard 
              key={peer.id} 
              peer={peer} 
              isRequested={requestedPeers.has(peer.id)}
              onConnect={() => handleConnect(peer.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

const PeerCard = ({ peer, isRequested, onConnect }) => {
  return (
    <div className={`group bg-white rounded-3xl p-6 border ${peer.liveRoomId ? 'border-red-200 shadow-red-50' : 'border-gray-100'} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden`}>
      {/* Top Banner Accent */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${peer.liveRoomId ? 'bg-gradient-to-r from-red-500 to-orange-400 opacity-100' : 'bg-gradient-to-r from-brand to-indigo-400 opacity-0 group-hover:opacity-100'} transition-opacity`}></div>
      
      {/* Header Info */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <img src={peer.avatar} className={`w-16 h-16 rounded-2xl object-cover shadow-sm ring-2 ${peer.liveRoomId ? 'ring-red-500 ring-offset-2' : 'ring-gray-100'}`} alt={peer.name} />
          {peer.liveRoomId ? (
            <div className="absolute -bottom-2 -left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
            </div>
          ) : peer.isOnline ? (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-green border-2 border-white rounded-full"></div>
          ) : null}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-lg text-gray-900 leading-tight">{peer.name}</h4>
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold">
              <Star size={12} className="fill-amber-500 text-amber-500" />
              {peer.rating}
            </div>
          </div>
          <p className="text-sm font-medium text-brand mt-0.5">{peer.major}</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
            <MapPin size={12}/> <span>{peer.distance} away</span>
          </div>
        </div>
      </div>

      {/* Badges */}
      {peer.badges && peer.badges.length > 0 && (
        <div className="flex gap-2 mb-4">
          {peer.badges.map(badge => (
            <span key={badge} className="px-2 py-1 bg-brand/5 text-brand text-xs font-semibold rounded-md border border-brand/10">
              {badge}
            </span>
          ))}
        </div>
      )}

      {/* Bio */}
      <p className="text-sm text-gray-600 mb-6 flex-1 leading-relaxed">
        "{peer.bio}"
      </p>

      {/* Skills */}
      <div className="space-y-4 mb-6 pt-4 border-t border-gray-50">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Can help with</p>
          <div className="flex flex-wrap gap-1.5">
            {peer.strongIn.map(skill => (
              <span key={skill} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Needs help with</p>
          <div className="flex flex-wrap gap-1.5">
            {peer.needsHelpWith.map(skill => (
              <span key={skill} className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-lg">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-2">
        {peer.liveRoomId && (
          <Link 
            to={`/watch/${peer.liveRoomId}`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 hover:shadow-md hover:shadow-red-500/20 active:scale-95 transition-all duration-300"
          >
            <Play size={18} className="fill-white" />
            <span>Watch Live Stream</span>
          </Link>
        )}
        <button 
          onClick={onConnect}
          disabled={isRequested}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 ${
            isRequested 
              ? 'bg-brand-green/10 text-brand-green cursor-default' 
              : peer.liveRoomId 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-brand text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-brand/20 active:scale-95'
          }`}
        >
          {isRequested ? (
            <>
              <Check size={18} />
              <span>Request Sent</span>
            </>
          ) : (
            <>
              <UserPlus size={18} />
              <span>Connect</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FindPeer;

