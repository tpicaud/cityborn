'use client';

import type React from 'react';
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';

interface TimerComponentProps {
  totalTime: number;
  endMessage: string;
  setTimerEnded: Dispatch<SetStateAction<boolean>>;
}

const TimerComponent: React.FC<TimerComponentProps> = ({
  totalTime,
  endMessage,
  setTimerEnded,
}) => {
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      const elapsedTime = (Date.now() - startTime.current) / 1000;
      const newTimeLeft = Math.max(totalTime - elapsedTime, 0);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft <= 0) {
        setTimerEnded(true);
        clearInterval(intervalId);
      }
    }, 10); // Met à jour toutes les 100ms

    return () => clearInterval(intervalId); // Nettoyage de l'intervalle
  }, []);

  // Calcul de la largeur de la barre de progression en pourcentage
  const progress = (timeLeft / totalTime) * 100;

  // Formate le temps restant en minutes et secondes
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? `0${secs}` : secs}`;
  };

  return (
    <div className="relative w-full h-10 bg-gray-300 bg-opacity-60 rounded-full overflow-hidden z-50">
      <div
        className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-[0ms]"
        style={{ width: `${progress}%` }}
      ></div>
      <span
        className={`absolute inset-0 flex items-center justify-center font-semibold text-xl transition-colors duration-500 
            ${timeLeft <= 5 ? 'text-red-500' : 'text-white'}`}
      >
        {timeLeft > 0 ? formatTime(timeLeft) : endMessage}
      </span>
    </div>
  );
};

export default TimerComponent;
