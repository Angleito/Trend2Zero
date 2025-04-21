'use client';
import React, { useState } from 'react';
export default function AnimationTestPage() {
    const [isAnimating, setIsAnimating] = useState(false);
    return (<div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex flex-col items-center justify-center p-4">
      <div className={`
          w-64 h-64 
          bg-white 
          rounded-lg 
          shadow-xl 
          flex 
          items-center 
          justify-center 
          cursor-pointer 
          transition-all 
          duration-500 
          ease-in-out 
          transform 
          hover:scale-105 
          ${isAnimating ? 'animate-bounce' : ''}
        `} onClick={() => setIsAnimating(!isAnimating)}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Tailwind Animation
          </h2>
          <p className="text-sm text-gray-600">
            Click to {isAnimating ? 'stop' : 'start'} bouncing
          </p>
        </div>
      </div>

      <div className="mt-8 space-x-4">
        <button className="
            px-4 
            py-2 
            bg-blue-500 
            text-white 
            rounded 
            hover:bg-blue-600 
            transition-colors 
            duration-300 
            active:scale-95
          " onClick={() => setIsAnimating(true)}>
          Start Animation
        </button>
        <button className="
            px-4 
            py-2 
            bg-red-500 
            text-white 
            rounded 
            hover:bg-red-600 
            transition-colors 
            duration-300 
            active:scale-95
          " onClick={() => setIsAnimating(false)}>
          Stop Animation
        </button>
      </div>

      <div className="mt-8 w-full max-w-md">
        <div className="
            h-2 
            bg-gradient-to-r 
            from-blue-500 
            via-purple-500 
            to-pink-500 
            rounded-full 
            animate-pulse
          "></div>
      </div>
    </div>);
}
