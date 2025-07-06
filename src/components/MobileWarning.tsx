import React from 'react';

const MobileWarning = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold mb-6">Desktop Experience Only</h1>
        <p className="text-lg mb-4">
          This portfolio is designed to provide an immersive experience that's best viewed on a desktop or laptop computer.
        </p>
        <p className="text-gray-400">
          Please visit this site on a desktop device to explore all the interactive features and animations.
        </p>
        <div className="mt-8 text-sm text-gray-500">
          💻 Recommended minimum screen width: 1024px
        </div>
      </div>
    </div>
  );
};

export default MobileWarning; 