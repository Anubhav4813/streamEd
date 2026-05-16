import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Video, Users, 
  MoreHorizontal, Play, CalendarClock, ChevronLeft, ChevronRight,
  BookOpen, Plus, X
} from 'lucide-react';

// Data fetched from API

const getTypeIcon = (type) => {
  switch(type) {
    case 'Hosting': return <Video size={16} />;
    case 'Peer Study': return <Users size={16} />;
    case 'Attending': default: return <BookOpen size={16} />;
  }
};

const getColorClasses = (color) => {
  const map = {
    brand: 'bg-brand/10 text-brand border-brand/20',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    gray: 'bg-gray-100 text-gray-600 border-gray-200'
  };
  return map[color] || map.brand;
};

const Schedule = () => {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newSession, setNewSession] = useState({
    title: '', type: 'Attending', participant: '', date: '', time: '', duration: '60 min', subject: ''
  });

  const fetchSchedules = () => {
    setLoading(true);
    fetch('/api/schedules')
      .then(res => res.json())
      .then(data => {
        setScheduleEvents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      });
      setShowModal(false);
      fetchSchedules();
    } catch(err) {
      console.error(err);
    }
  };

  const filteredEvents = scheduleEvents.filter(e => e.status === activeTab);

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const today = new Date();
  const isActualToday = (day) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth.getMonth() && 
           today.getFullYear() === currentMonth.getFullYear();
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">My Schedule</h2>
          <p className="text-gray-500">Manage your upcoming streams, study sessions, and classes.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-brand text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 shadow-sm transition-all duration-200 flex items-center justify-center gap-2">
          <Plus size={18} />
          <span>Schedule Session</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Calendar Widget & Stats */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Mini Calendar */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><ChevronLeft size={18}/></button>
                <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><ChevronRight size={18}/></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 mb-2">
              <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {Array.from({length: firstDayOfMonth}).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({length: daysInMonth}).map((_, i) => {
                const day = i + 1;
                const isToday = isActualToday(day);
                
                const dateStr = `${monthNames[currentMonth.getMonth()].substring(0, 3)} ${day}, ${currentMonth.getFullYear()}`;
                const hasEvent = groupedEvents[dateStr] !== undefined;

                return (
                  <button 
                    key={i} 
                    className={`
                      aspect-square rounded-full flex items-center justify-center transition-colors
                      ${isToday ? 'bg-brand text-white font-bold shadow-md shadow-brand/30' : 'text-gray-700 hover:bg-gray-100'}
                      ${hasEvent && !isToday ? 'font-bold text-brand ring-1 ring-brand/30 bg-brand/5' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-br from-brand to-indigo-600 rounded-2xl p-6 shadow-lg shadow-brand/20 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Calendar size={100} />
             </div>
             <div className="relative z-10">
                <h4 className="text-brand-100 font-medium mb-1 text-sm">This Week</h4>
                <p className="text-3xl font-extrabold mb-6">12.5 hrs</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-brand-100">Learning</span>
                    <span className="font-semibold">8 hrs</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div className="bg-white rounded-full h-1.5 w-[65%]"></div>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-brand-100">Teaching</span>
                    <span className="font-semibold">4.5 hrs</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div className="bg-emerald-400 rounded-full h-1.5 w-[35%]"></div>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Events List */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-max">
            {['Upcoming', 'Past'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Events List */}
          <div className="space-y-8">
            {loading ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
                <p className="text-gray-500 max-w-md mx-auto">Loading schedule...</p>
              </div>
            ) : Object.keys(groupedEvents).length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarClock className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your calendar is clear</h3>
                <p className="text-gray-500 max-w-md mx-auto">You have no {activeTab.toLowerCase()} study sessions or streams scheduled at this time.</p>
              </div>
            ) : (
              Object.entries(groupedEvents).map(([date, events]) => (
                <div key={date}>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-gray-400" />
                    {date}
                  </h3>
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div 
                        key={event.id} 
                        className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row gap-5"
                      >
                        {/* Time Column */}
                        <div className="flex flex-col items-start md:items-end md:w-28 shrink-0 relative z-10">
                           <span className="text-lg font-bold text-gray-900">{event.time}</span>
                           <span className="text-sm font-medium text-gray-500 flex items-center gap-1 mt-1">
                             <Clock size={14}/> {event.duration}
                           </span>
                        </div>

                        {/* Divider - Hidden on mobile */}
                        <div className="hidden md:block w-px bg-gray-100 relative">
                           <div className="absolute top-2 -left-1 w-2.5 h-2.5 rounded-full bg-gray-200 group-hover:bg-brand transition-colors"></div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 relative z-10">
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                            <h4 className="font-bold text-xl text-gray-900">{event.title}</h4>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 w-max ${getColorClasses(event.color)}`}>
                              {getTypeIcon(event.type)}
                              {event.type}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1.5">
                              {event.type === 'Peer Study' ? <Users size={16} className="text-gray-400"/> : <Video size={16} className="text-gray-400"/>}
                              <span className="font-medium">{event.participant}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <BookOpen size={16} className="text-gray-400"/>
                              <span>{event.subject}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3">
                            {event.isStartingSoon ? (
                              <button className="bg-brand text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-brand/20 flex items-center gap-2">
                                <Play size={16} fill="currentColor" />
                                Join Now
                              </button>
                            ) : (
                              <button className="bg-gray-50 text-gray-700 border border-gray-200 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors">
                                View Details
                              </button>
                            )}
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                              <MoreHorizontal size={20} />
                            </button>
                          </div>
                        </div>

                        {/* Starting Soon Indicator Overlay */}
                        {event.isStartingSoon && (
                           <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-bl-full -z-0"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Create Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Schedule New Session</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand/20 outline-none" value={newSession.title} onChange={e => setNewSession({...newSession, title: e.target.value})} placeholder="e.g. Advanced React Patterns" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                  <select className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand/20 outline-none bg-white" value={newSession.type} onChange={e => setNewSession({...newSession, type: e.target.value})}>
                    <option>Attending</option>
                    <option>Hosting</option>
                    <option>Peer Study</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                  <input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand/20 outline-none" value={newSession.subject} onChange={e => setNewSession({...newSession, subject: e.target.value})} placeholder="e.g. Coding" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Participant / Host</label>
                <input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand/20 outline-none" value={newSession.participant} onChange={e => setNewSession({...newSession, participant: e.target.value})} placeholder="e.g. CodeWizard or Open Session" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                  <input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand/20 outline-none" value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} placeholder="e.g. Oct 18, 2026" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
                  <input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand/20 outline-none" value={newSession.time} onChange={e => setNewSession({...newSession, time: e.target.value})} placeholder="e.g. 2:00 PM" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-brand text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-brand/20">Add Session</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Schedule;
