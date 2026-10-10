import { useEffect, useRef, useState } from 'react';
import { formatDataHora } from '../utils/pdeCleaner';

interface ClockSLAProps {
  onTick: (now: Date) => void;
}

export function ClockSLA({ onTick }: ClockSLAProps) {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const lastSLAMinute = useRef<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      const currentMinute = Math.floor(now.getTime() / 60000);
      if (currentMinute !== lastSLAMinute.current) {
        lastSLAMinute.current = currentMinute;
        onTick(now);
      }
    };

    updateTime();
    const timer = window.setInterval(updateTime, 10000);
    return () => window.clearInterval(timer);
  }, [onTick]);

  return <>{formatDataHora(currentTime)}</>;
}
