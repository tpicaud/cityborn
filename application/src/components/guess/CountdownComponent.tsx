import React, { useEffect, useState, useRef } from 'react';

interface CountdownComponentProps {
  totalTime: number; // Durée totale en secondes
  endMessage: string; // Message de fin
  handleIsTimeUp: () => void; // Fonction de rappel à la fin du compte à rebours
}

const CountdownComponent: React.FC<CountdownComponentProps> = ({ totalTime, endMessage, handleIsTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Fonction de mise à jour continue du compte à rebours
    const updateCountdown = () => {
      const elapsedTime = (Date.now() - startTime.current) / 1000; // En secondes
      const newTimeLeft = Math.max(totalTime - elapsedTime, 0);

      setTimeLeft(newTimeLeft);

      // Si le temps n'est pas écoulé, continue l'animation
      if (newTimeLeft > 0) {
        animationFrameId.current = requestAnimationFrame(updateCountdown);
      } else {
        handleIsTimeUp();
      }
    };

    // Démarre l'animation
    const animationFrameId = { current: requestAnimationFrame(updateCountdown) };

    // Nettoyage du composant si démonté
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [totalTime, handleIsTimeUp]);

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

export default CountdownComponent;
