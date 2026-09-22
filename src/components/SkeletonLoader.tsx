import React from 'react';
import { WifiOff, Loader2 } from 'lucide-react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      
      {/* Weak Connection Notice Header */}
      <div className="mb-6 bg-amber-500/10 border border-amber-500/20 text-amber-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs max-w-2xl w-full shadow-xs animate-fadeIn">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
        <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-semibold">Weak connection or offline mode detected. Rendering high-performance offline skeleton view...</span>
        <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto text-amber-600" />
      </div>

      {/* Main Skeleton Grid Matching Mockup in image.png */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column Skeleton Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 animate-pulse">
          {/* Large image placeholder */}
          <div className="w-full h-56 bg-slate-200 rounded-2xl" />

          {/* Title and Button bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-2 w-1/2">
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              <div className="h-3 bg-slate-200 rounded-md w-1/2" />
            </div>
            <div className="h-9 bg-slate-200 rounded-xl w-28" />
          </div>

          <hr className="border-slate-100" />

          {/* Text lines section */}
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded-md w-5/6" />
            <div className="h-3 bg-slate-200 rounded-md w-1/3" />
            <div className="h-3 bg-slate-200 rounded-md w-3/4" />
            <div className="h-3 bg-slate-200 rounded-md w-2/3" />
          </div>

          {/* Bottom Pill bar */}
          <div className="pt-2">
            <div className="h-10 bg-slate-200 rounded-xl w-full" />
          </div>
        </div>

        {/* Right Column Skeleton Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 animate-pulse flex flex-col justify-between">
          
          {/* Top header row with avatar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="space-y-2 w-2/3">
              <div className="h-4 bg-slate-200 rounded-md w-4/5" />
              <div className="h-3 bg-slate-200 rounded-md w-1/2" />
            </div>
            <div className="w-11 h-11 bg-slate-200 rounded-full shrink-0" />
          </div>

          {/* Large vertical card body */}
          <div className="w-full flex-1 min-h-[340px] bg-slate-200 rounded-2xl my-auto" />

          {/* Bottom subtle bar */}
          <div className="h-3 bg-slate-200 rounded-md w-1/3 mx-auto mt-2" />
        </div>

      </div>

      <p className="text-xs text-slate-400 mt-6 font-medium">
        Synchronizing encrypted local secure storage & cloud fallback...
      </p>
    </div>
  );
};
