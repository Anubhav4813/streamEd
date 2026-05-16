import React from 'react';

const Community = () => (
  <div className="p-6 lg:p-8 max-w-4xl mx-auto">
    <h2 className="text-3xl font-bold text-gray-900 mb-6">Community Forums</h2>
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
       {[1,2,3].map(i => (
         <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <h4 className="font-bold text-gray-800 text-lg cursor-pointer hover:text-brand hover:underline">How do I integrate by parts efficiently?</h4>
            <p className="text-sm text-gray-500 mt-1">Asked by Student {i} • {i+2} replies</p>
         </div>
       ))}
    </div>
  </div>
);
export default Community;
