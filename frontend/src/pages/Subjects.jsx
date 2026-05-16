import React from 'react';

const Subjects = () => {
   const subjects = ['Mathematics', 'Computer Science', 'Physics', 'Biology', 'History', 'Literature'];
   return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Browse Subjects</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
         {subjects.map((sub, i) => (
            <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:border-brand/30 hover:shadow-md cursor-pointer transition-all text-center">
               <h3 className="font-bold text-xl text-gray-800">{sub}</h3>
               <p className="text-sm text-brand font-medium mt-2">{Math.floor(Math.random() * 50) + 10} active tutors</p>
            </div>
         ))}
      </div>
      </div>
   );
};
export default Subjects;
