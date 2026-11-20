import React, { useState } from 'react';
import { MoveHorizontal } from 'lucide-react';
import { SafeImage } from './SafeImage';

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Blank Denim Canvas',
  afterLabel = 'Hand-Painted in Dehradun',
}) => {
  const [position, setPosition] = useState(55);

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#E6DDD0] dark:border-[#332D27] select-none bg-[#F3ECE2] dark:bg-[#1E1B18]">
      {/* After Image (Base) */}
      <SafeImage
        src={afterSrc}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Before Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <SafeImage
          src={beforeSrc}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Divider Line & Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)] pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-[#1F1D1B] shadow-md flex items-center justify-center border border-[#E6DDD0]">
          <MoveHorizontal className="w-4 h-4 text-[#C65D3B]" />
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#1F1D1B]/75 text-white text-xs font-medium pointer-events-none">
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-[#C65D3B]/90 text-white text-xs font-medium pointer-events-none">
        {afterLabel}
      </span>

      {/* Accessible Range Input */}
      <input
        type="range"
        min={5}
        max={95}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Before and after artwork comparison slider"
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
      />
    </div>
  );
};
