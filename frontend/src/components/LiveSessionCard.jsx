import React from 'react';
import { Star, Users as UsersIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LiveSessionCard = ({ id, title, host, viewers, rating, subject }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
      <div className="relative h-40 bg-gray-200 dark:bg-gray-700 p-2">
        <img src={`https://picsum.photos/seed/${title}/400/200`} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-white/90 backdrop-blur-sm text-brand text-[10px] font-bold px-2 py-1 rounded">
            {subject}
          </span>
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            Live
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
          <Star size={10} className="text-yellow-500 fill-yellow-500" />
          {rating}
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-3 line-clamp-2">{title}</h4>
        
        <div className="flex items-center justify-between mt-auto mb-4">
          <div className="flex items-center gap-2">
            <img src={`https://i.pravatar.cc/150?u=${host}`} alt={host} className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{host}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs font-medium">
            <UsersIcon size={14} />
            {viewers}
          </div>
        </div>
        
        <button 
          onClick={() => navigate(`/watch/${id}`)}
          className="w-full bg-brand/10 hover:bg-brand text-brand hover:text-white dark:bg-brand/20 dark:hover:bg-brand dark:text-indigo-300 font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          Join Session
        </button>
      </div>
    </div>
  );
};

export default LiveSessionCard;
