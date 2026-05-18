import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  BookOpen, Code, Calculator, Atom, Globe, 
  Briefcase, Palette, Landmark, Stethoscope, Scale,
  ChevronRight, Users
} from 'lucide-react';

const SUBJECTS_DATA = [
  { id: 'Engineering', title: 'Engineering & CS', desc: 'Software development, hardware design, and algorithms.', icon: <Code size={28} />, color: 'from-blue-500 to-cyan-400' },
  { id: 'Mathematics', title: 'Mathematics', desc: 'Calculus, linear algebra, statistics, and discrete math.', icon: <Calculator size={28} />, color: 'from-emerald-500 to-teal-400' },
  { id: 'Science', title: 'Natural Sciences', desc: 'Physics, chemistry, biology, and environmental science.', icon: <Atom size={28} />, color: 'from-purple-500 to-fuchsia-400' },
  { id: 'Languages', title: 'Languages', desc: 'Linguistics, grammar, and literature.', icon: <Globe size={28} />, color: 'from-orange-500 to-amber-400' },
  { id: 'Business', title: 'Business', desc: 'Finance, marketing, accounting, and management.', icon: <Briefcase size={28} />, color: 'from-rose-500 to-pink-400' },
  { id: 'Arts', title: 'Arts & Design', desc: 'Visual arts, graphic design, music, and theater.', icon: <Palette size={28} />, color: 'from-indigo-500 to-blue-400' },
  { id: 'History', title: 'History & Humanities', desc: 'World history, sociology, philosophy, and ethics.', icon: <Landmark size={28} />, color: 'from-yellow-500 to-orange-400' },
  { id: 'Medicine', title: 'Medicine & Health', desc: 'Anatomy, nursing, public health, and pre-med studies.', icon: <Stethoscope size={28} />, color: 'from-red-500 to-rose-400' },
  { id: 'Law', title: 'Law & Politics', desc: 'Pre-law, political science, forensics, and debate.', icon: <Scale size={28} />, color: 'from-slate-600 to-slate-400' },
];

const Subjects = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const peersRes = await fetch('/api/peers');
        const peersData = await peersRes.json();
        
        // Group peers by category
        const newStats = {};
        SUBJECTS_DATA.forEach(s => newStats[s.id] = { peers: 0 });
        
        peersData.forEach(p => {
          if (newStats[p.category]) {
            newStats[p.category].peers += 1;
          }
        });

        setStats(newStats);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-10 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 text-brand rounded-full text-sm font-semibold mb-4">
          <BookOpen size={16} />
          <span>Academic Directory</span>
        </div>
        <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Browse Subjects</h2>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto md:mx-0">
          Explore different academic fields to find specialized peers, tutors, and upcoming study sessions tailored to your coursework.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SUBJECTS_DATA.map((sub) => (
          <div 
            key={sub.id} 
            onClick={() => navigate('/peers')} 
            className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col h-full"
          >
            {/* Header / Icon */}
            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sub.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {sub.icon}
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand group-hover:text-white transition-colors shadow-sm">
                <ChevronRight size={20} />
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand transition-colors">{sub.title}</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed line-clamp-2">{sub.desc}</p>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-50 relative z-10">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                <Users size={16} className="text-brand" />
                {loading ? '-' : (stats[sub.id]?.peers || 0)} Tutors
              </div>
            </div>

            {/* Decorative Background Blob */}
            <div className={`absolute -bottom-24 -right-24 w-48 h-48 bg-gradient-to-br ${sub.color} opacity-5 rounded-full group-hover:scale-[2] transition-transform duration-700 pointer-events-none`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subjects;
