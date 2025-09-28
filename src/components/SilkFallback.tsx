// Fallback component when Three.js is not available
import React from 'react';

const SilkFallback: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>
    </div>
  );
};

export default SilkFallback;
