import React from 'react';
import { VehicleGpsTelemetry } from '../../types';
import { Gauge, AlertTriangle, ShieldCheck, Flame, Zap } from 'lucide-react';

interface RunningCarMarkerProps {
  telemetry: VehicleGpsTelemetry;
  isSelected?: boolean;
  isBreached?: boolean;
  onClick?: () => void;
}

export const RunningCarMarker: React.FC<RunningCarMarkerProps> = ({
  telemetry,
  isSelected = false,
  isBreached = false,
  onClick
}) => {
  const isMoving = telemetry.isMoving && telemetry.currentLocation.speedKmh > 0;
  const speed = telemetry.currentLocation.speedKmh;
  const heading = telemetry.currentLocation.heading || 0;
  const isRented = telemetry.status === 'RENTED' || !!telemetry.activeRental;

  // Wheel spin animation duration decreases as speed increases
  const wheelDuration = speed > 0 ? Math.max(0.12, 0.6 - (speed / 160)).toFixed(2) + 's' : '0s';

  return (
    <div 
      onClick={onClick}
      className={`group relative flex flex-col items-center select-none cursor-pointer transition-transform duration-300 ${
        isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-20'
      }`}
    >
      {/* 1. Floating Telemetry Speed Badge */}
      <div 
        className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight mb-1 shadow-lg border flex items-center gap-1 transition-all ${
          isBreached 
            ? 'bg-red-600 text-white border-red-300 animate-bounce' 
            : isRented 
            ? 'bg-amber-500 text-slate-950 border-amber-300' 
            : 'bg-slate-900 text-white border-slate-700'
        }`}
      >
        {isBreached ? (
          <>
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>BREACH: {speed} km/h</span>
          </>
        ) : (
          <>
            <Gauge className="w-2.5 h-2.5" />
            <span>{speed} km/h</span>
            {isMoving && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
          </>
        )}
      </div>

      {/* 2. Geofence Boundary Breach Alarm Pulse Ring */}
      {isBreached && (
        <span className="absolute top-5 -inset-2 rounded-full border-4 border-red-500 animate-geofence-breach-ring pointer-events-none" />
      )}

      {/* 3. Main Running Car Body with Orientation Heading */}
      <div className="relative flex items-center justify-center">
        
        {/* Animated Moving Road Underneath Car (Visible when Moving) */}
        {isMoving && (
          <div className="absolute -inset-x-3 -bottom-1 h-3 rounded-full bg-slate-950/80 overflow-hidden border border-slate-800 shadow-inner flex items-center pointer-events-none">
            <div 
              className="w-[200%] h-0.5 border-t-2 border-dashed border-amber-400/80 animate-road-stripes"
              style={{ animationDuration: wheelDuration }}
            />
          </div>
        )}

        {/* Rotated Vehicle Platform based on Compass Heading */}
        <div 
          className={`relative transition-transform duration-500 ease-out ${isMoving ? 'animate-car-vibe' : ''}`}
          style={{ transform: `rotate(${heading}deg)` }}
        >
          {/* Headlights Beam Cone Shining Forward */}
          {isMoving && (
            <div 
              className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-9 pointer-events-none animate-headlight-cone"
              style={{
                background: 'radial-gradient(ellipse at 50% 100%, rgba(254, 240, 138, 0.75) 0%, rgba(254, 240, 138, 0.25) 45%, rgba(254, 240, 138, 0) 80%)',
                clipPath: 'polygon(30% 100%, 70% 100%, 100% 0%, 0% 0%)',
              }}
            />
          )}

          {/* Exhaust Smoke & Wind Trail Behind Car */}
          {isMoving && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-none">
              <span 
                className="w-2 h-2 rounded-full bg-slate-400/80 animate-exhaust"
                style={{ animationDelay: '0.1s' }} 
              />
              <span 
                className="w-2.5 h-2.5 rounded-full bg-slate-300/60 animate-exhaust"
                style={{ animationDelay: '0.35s' }} 
              />
            </div>
          )}

          {/* Running Car Container */}
          <div className="relative w-12 h-14 flex items-center justify-center">
            
            {/* 4 Spinning Wheels on sides */}
            {/* Front-Left Wheel */}
            <div 
              className={`absolute top-2 -left-1.5 w-2 h-3.5 rounded-sm bg-slate-950 border border-slate-600 shadow-sm ${isMoving ? 'animate-wheel-spin' : ''}`}
              style={{ animationDuration: wheelDuration }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span className="w-1 h-0.5 bg-slate-400 rounded-full" />
              </div>
            </div>

            {/* Front-Right Wheel */}
            <div 
              className={`absolute top-2 -right-1.5 w-2 h-3.5 rounded-sm bg-slate-950 border border-slate-600 shadow-sm ${isMoving ? 'animate-wheel-spin' : ''}`}
              style={{ animationDuration: wheelDuration }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span className="w-1 h-0.5 bg-slate-400 rounded-full" />
              </div>
            </div>

            {/* Rear-Left Wheel */}
            <div 
              className={`absolute bottom-2 -left-1.5 w-2 h-3.5 rounded-sm bg-slate-950 border border-slate-600 shadow-sm ${isMoving ? 'animate-wheel-spin' : ''}`}
              style={{ animationDuration: wheelDuration }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span className="w-1 h-0.5 bg-slate-400 rounded-full" />
              </div>
            </div>

            {/* Rear-Right Wheel */}
            <div 
              className={`absolute bottom-2 -right-1.5 w-2 h-3.5 rounded-sm bg-slate-950 border border-slate-600 shadow-sm ${isMoving ? 'animate-wheel-spin' : ''}`}
              style={{ animationDuration: wheelDuration }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span className="w-1 h-0.5 bg-slate-400 rounded-full" />
              </div>
            </div>

            {/* Aerodynamic Car Body Shell */}
            <div 
              className={`relative w-9 h-13 rounded-xl shadow-xl flex flex-col items-center justify-between p-1 border-2 transition-all overflow-hidden ${
                isBreached
                  ? 'bg-gradient-to-b from-red-600 via-rose-700 to-red-950 border-white text-white'
                  : isRented
                  ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 border-white text-slate-950'
                  : 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border-slate-300 text-white'
              }`}
            >
              {/* Front Windshield & Headlights */}
              <div className="w-full flex items-center justify-between px-0.5 mt-0.5">
                {/* Left Headlight */}
                <span className={`w-1.5 h-1.5 rounded-full ${isMoving ? 'bg-yellow-200 shadow-[0_0_8px_#fde047]' : 'bg-slate-400'}`} />
                {/* Hood scoop line */}
                <span className="w-3 h-0.5 bg-black/30 rounded-full" />
                {/* Right Headlight */}
                <span className={`w-1.5 h-1.5 rounded-full ${isMoving ? 'bg-yellow-200 shadow-[0_0_8px_#fde047]' : 'bg-slate-400'}`} />
              </div>

              {/* Windshield Glass */}
              <div className="w-6 h-3 rounded-md bg-sky-950/70 border border-sky-400/40 shadow-inner flex items-center justify-center my-0.5">
                <span className="w-4 h-0.5 bg-sky-200/50 rounded-full -rotate-12" />
              </div>

              {/* Roof Cabin / Sentry Indicator */}
              <div className="w-5 h-2.5 rounded-sm bg-slate-950/50 flex items-center justify-center">
                <span className={`w-1.5 h-1.5 rounded-full ${isMoving ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              </div>

              {/* Rear Window Glass */}
              <div className="w-6 h-2 rounded-sm bg-sky-950/70 border border-sky-400/30" />

              {/* Rear Taillights */}
              <div className="w-full flex items-center justify-between px-0.5 mb-0.5">
                <span className="w-1.5 h-1 rounded-sm bg-red-500 shadow-[0_0_4px_#ef4444]" />
                <span className="w-3 h-0.5 bg-black/40 rounded-full" />
                <span className="w-1.5 h-1 rounded-sm bg-red-500 shadow-[0_0_4px_#ef4444]" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 4. License Plate Tag */}
      <div className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shadow-md border ${
        isBreached 
          ? 'bg-red-950 text-red-200 border-red-600' 
          : 'bg-slate-950/95 text-slate-200 border-slate-800'
      }`}>
        {telemetry.licensePlate}
      </div>

      {/* 5. Running Status Label */}
      {isMoving && (
        <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400 bg-slate-950/90 px-1 rounded border border-emerald-500/30 mt-0.5">
          RUNNING
        </span>
      )}
    </div>
  );
};
