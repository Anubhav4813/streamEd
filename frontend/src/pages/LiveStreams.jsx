import React, { useState, useEffect } from 'react';
import { Video, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LiveSessionCard from '../components/LiveSessionCard';
import { useAppContext } from '../context/AppContext';

const LiveStreams = () => {
  const navigate = useNavigate();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAppContext();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/live/rooms', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setStreams(data);
        }
      } catch (err) {
        console.error('Failed to fetch rooms', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
    // Optional: Refresh rooms every 10 seconds
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Live Streams</h2>
          <p className="text-gray-500 mt-1">Join an ongoing session and learn together.</p>
        </div>
        <button 
          onClick={() => navigate('/host')}
          className="bg-brand-green text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-emerald-600 transition-colors"
        >
          Start Your Own Stream
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      ) : streams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Video size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No active streams</h3>
          <p className="text-gray-500 mb-6">There are no live sessions happening right now. Be the first to start one!</p>
          <button 
            onClick={() => navigate('/host')}
            className="bg-brand text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Start Streaming
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map(stream => (
            <LiveSessionCard key={stream.id} {...stream} />
          ))}
        </div>
      )}
    </div>
  );
};
export default LiveStreams;
