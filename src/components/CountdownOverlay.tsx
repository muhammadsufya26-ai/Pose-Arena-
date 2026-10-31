import React, { useEffect, useState } from 'react';
import { soundFx } from '../services/audioEngine';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [count, setCount] = useState<number>(3);
  const [isGo, setIsGo] = useState<boolean>(false);

  useEffect(() => {
    soundFx.playCountdownTick(false);

    const t2 = setTimeout(() => {
      setCount(2);
      soundFx.playCountdownTick(false);
    }, 900);

    const t1 = setTimeout(() => {
      setCount(1);
      soundFx.playCountdownTick(false);
    }, 1800);

    const tGo = setTimeout(() => {
      setIsGo(true);
      soundFx.playCountdownTick(true);
    }, 2700);

    const tEnd = setTimeout(() => {
      onComplete();
    }, 3300);

    return () => {
      clearTimeout(t2);
      clearTimeout(t1);
      clearTimeout(tGo);
      clearTimeout(tEnd);
    };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0b0d12]/80 pointer-events-none select-none">
      <div className="text-center font-mono">
        {!isGo ? (
          <div>
            <div className="text-7xl md:text-8xl font-black text-white tabular-nums tracking-tighter">
              {count}
            </div>
            <div className="mt-2 text-xs uppercase tracking-widest text-[#10b981]">
              CALIBRATING OPTICAL AXIS
            </div>
          </div>
        ) : (
          <div>
            <div className="text-6xl md:text-7xl font-black text-[#10b981] tracking-wider">
              ENGAGE
            </div>
            <div className="mt-2 text-xs uppercase tracking-widest text-[#94a3b8]">
              ARENA ACTIVE // 60s
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
