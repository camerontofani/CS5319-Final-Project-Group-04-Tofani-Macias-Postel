import React from 'react';

const Onboarding = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Configure Your Study Profile</h2>
        <p className="text-gray-500">Help us personalize your study plan in just a few steps.</p>
      </header>

      <div className="space-y-8">
        {/* Course Selection Placeholder */}
        <section>
          <h3 className="font-semibold text-indigo-600 mb-4 uppercase tracking-wider text-sm">1. Your Courses</h3>
          <input type="text" placeholder="Enter course name (e.g., CS5319)" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        </section>

        {/* Weekly Availability per wireframe */}
        <section>
          <h3 className="font-semibold text-indigo-600 mb-4 uppercase tracking-wider text-sm">2. Weekly Availability</h3>
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center p-2 bg-gray-50 rounded font-medium text-xs text-gray-400">{day}</div>
            ))}
            {/* Simple representation of the time grid from Screen B */}
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-8 border border-dashed border-gray-200 rounded hover:bg-indigo-50 cursor-pointer"></div>
            ))}
          </div>
        </section>

        {/* Learning Styles per wireframe */}
        <section>
          <h3 className="font-semibold text-indigo-600 mb-4 uppercase tracking-wider text-sm">3. Study Preferences</h3>
          <div className="grid grid-cols-2 gap-4">
            {['Visual', 'Auditory', 'Kinesthetic', 'Collaborative'].map(style => (
              <label key={style} className="flex items-center p-4 border rounded-xl hover:border-indigo-500 cursor-pointer transition-all">
                <input type="radio" name="learningStyle" className="w-4 h-4 text-indigo-600" />
                <span className="ml-3 font-medium text-gray-700">{style}</span>
              </label>
            ))}
          </div>
        </section>

        <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
          Generate My Plan →
        </button>
      </div>
    </div>
  );
};

export default Onboarding;