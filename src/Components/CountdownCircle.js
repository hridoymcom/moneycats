import React from 'react';
const CountdownCircle = ({ remainingTime, totalTime }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = (remainingTime / totalTime) * circumference;

  // Time calculations
  const hours = Math.floor(remainingTime / (60 * 60 * 1000));
  const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);

  // Format time: H:MM:SS
  const displayTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  return (
    <div className="w-[90px] h-[45px] relative flex items-center justify-center">
      <svg className="transform -rotate-90 w-[45px] h-[45px]">
        {/* Background circle */}
        <circle
          cx="22.5"
          cy="22.5"
          r={radius}
          className="fill-none stroke-gray-700"
          strokeWidth="3"
        />
        {/* Progress circle */}
        <circle
          cx="22.5"
          cy="22.5"
          r={radius}
          className="fill-none stroke-yellow-500"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-medium text-white text-center leading-tight">
        {displayTime}
      </span>
    </div>
  );
};

export default CountdownCircle;
