import { useState, useEffect } from 'react';
import { FunctionSquare, Clock, Dna, Code } from 'lucide-react';
import LiveSessionCard from '../components/LiveSessionCard';
import { useAppContext } from '../context/AppContext';

const Dashboard = () => {
  const { token, user, darkMode } = useAppContext();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/live/rooms', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const recommended = data.sort((a, b) => b.viewers - a.viewers).slice(0, 3);
          setSessions(recommended);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  return (
    <div className={`p-6 lg:p-8 max-w-5xl mx-auto ${darkMode ? 'text-white' : ''}`}>
      <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
        Welcome back, {user?.name || user?.username || 'Guest'}!{' '}
        <span className="text-xl font-normal text-gray-500">Start learning or teaching now.</span>
      </h2>

      {/* Recommended Live Sessions */}
      <section className="mt-8">
        <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider mb-1`}>HAPPENING NOW</p>
        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Recommended Live Sessions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-10 flex justify-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className={`col-span-full py-12 text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl border shadow-sm`}>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                No live streams are happening right now. Be the first to start one!
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <LiveSessionCard key={session.id} {...session} />
            ))
          )}
        </div>
      </section>

      {/* Featured Subjects */}
      <section className="mt-10">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">FEATURED SUBJECTS</p>
        <div className="flex flex-wrap gap-4">
          <SubjectBadge icon={<FunctionSquare size={18} className="text-blue-500" />} label="Calculus" />
          <SubjectBadge icon={<Clock size={18} className="text-orange-500" />} label="History" />
          <SubjectBadge icon={<Dna size={18} className="text-green-500" />} label="Biology" />
          <SubjectBadge icon={<Code size={18} className="text-brand" />} label="Coding Python" />
        </div>
      </section>

      {/* Upcoming Sessions */}
      <section className="mt-10 pb-10">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">UPCOMING SESSIONS</p>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-6 flex flex-col md:flex-row gap-8`}>
          {/* Mock Calendar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 text-center`}>October 2026</div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
              <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {Array.from({ length: 31 }).map((_, i) => (
                <div key={i} className={`p-1.5 rounded-full ${i === 14 ? 'bg-brand text-white font-bold' : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} cursor-pointer`}`}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Event List */}
          <div className={`flex-1 space-y-4 border-t md:border-t-0 md:border-l ${darkMode ? 'border-gray-700' : 'border-gray-100'} pt-4 md:pt-0 md:pl-8`}>
            <EventItem title="Organic Chem review" host="HistoryHub" time="tomorrow 4 PM" color="bg-brand-green" darkMode={darkMode} />
            <EventItem title="Intro to Machine Learning" host="DataGeek" time="Friday 10 AM" color="bg-blue-500" darkMode={darkMode} />
            <EventItem title="Spanish Conversation" host="HolaAmigos" time="Saturday 2 PM" color="bg-orange-500" darkMode={darkMode} />
          </div>
        </div>
      </section>
    </div>
  );
};

const SubjectBadge = ({ icon, label }) => (
  <button className="bg-white border border-gray-200 shadow-sm rounded-xl px-5 py-3 flex items-center gap-3 hover:border-brand/30 hover:shadow-md transition-all">
    <div className="bg-gray-50 p-2 rounded-lg">{icon}</div>
    <span className="font-semibold text-gray-800 text-sm">{label}</span>
  </button>
);

const EventItem = ({ title, host, time, color, darkMode }) => (
  <div className="flex items-start gap-4">
    <div className={`w-1 h-12 ${color} rounded-full`}></div>
    <div className="flex-1">
      <h5 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} text-sm`}>{title}</h5>
      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
        <div className="w-4 h-4 rounded-full bg-gray-200 overflow-hidden">
          <img src={`https://i.pravatar.cc/150?u=${host}`} alt={host} className="w-full h-full object-cover" />
        </div>
        <span>{host}</span>
      </div>
    </div>
    <span className="text-xs font-medium text-gray-500 pt-1">{time}</span>
  </div>
);

export default Dashboard;
