

import React from 'react';
import InteractiveSlider from './InteractiveSlider';

interface LossMagnitudeProps {
  min: number;
  max: number;
  mostLikely: number;
  userMostLikelyLoss: number | null;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  onMostLikelyChange: (value: number) => void;
  onResetMostLikely: () => void;
}

const DiceIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M16 3H4a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1zM6 6a1 1 0 110 2 1 1 0 010-2zm8 8a1 1 0 110 2 1 1 0 010-2zm-4-4a1 1 0 110 2 1 1 0 010-2z" />
    </svg>
);

const LeftSkewIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 20c-4 0-8-16-18-16" />
    </svg>
);

const NormalDistributionIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20c4-16 12-16 16 0" />
    </svg>
);

const RightSkewIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20c4 0 8-16 18-16" />
    </svg>
);

const LossMagnitude: React.FC<LossMagnitudeProps> = ({ min, max, mostLikely, userMostLikelyLoss, onMinChange, onMaxChange, onMostLikelyChange, onResetMostLikely }) => {

  const isMaxLessThanMin = max > 0 && min > 0 && max < min;
  const isMostLikelyOutOfRange = mostLikely > 0 && min > 0 && max > 0 && !isMaxLessThanMin && (mostLikely < min || mostLikely > max);
  const isActionDisabled = min === 0 || max === 0 || isMaxLessThanMin;

  const SLIDER_MAX = 1_000_000_000; // 1 Billion

  const handleRandomClick = () => {
    if (!isActionDisabled) {
      const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
      onMostLikelyChange(randomValue);
    }
  };
  
  const isLeftSkewActive = userMostLikelyLoss !== null && userMostLikelyLoss === min;
  const isNormalActive = userMostLikelyLoss === null;
  const isRightSkewActive = userMostLikelyLoss !== null && userMostLikelyLoss === max;

  const baseButtonClass = `p-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary focus:z-10`;
  const activeButtonClass = 'bg-primary-light text-primary';
  const inactiveButtonClass = 'bg-white text-text-secondary hover:bg-slate-50';
  
  const mostLikelyActions = (
    <div className="flex items-stretch rounded-md border border-border-color divide-x divide-border-color shadow-sm">
      <button
        type="button"
        onClick={() => onMostLikelyChange(min)}
        className={`group relative ${baseButtonClass} rounded-l-md ${isLeftSkewActive ? activeButtonClass : inactiveButtonClass}`}
        disabled={isActionDisabled}
        aria-label="Set to Minimum Loss"
      >
        <LeftSkewIcon />
        <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 -translate-x-1/2 left-1/2">
          Left-skewed: Most loss events are expected to be closer to the minimum value.
        </div>
      </button>
      <button
        type="button"
        onClick={onResetMostLikely}
        className={`group relative ${baseButtonClass} ${isNormalActive ? activeButtonClass : inactiveButtonClass}`}
        disabled={isActionDisabled}
        aria-label="Reset to default value"
      >
        <NormalDistributionIcon />
         <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 -translate-x-1/2 left-1/2">
          Normal-like: Loss events are most likely to occur around a central value between min and max.
        </div>
      </button>
      <button
        type="button"
        onClick={() => onMostLikelyChange(max)}
        className={`group relative ${baseButtonClass} ${isRightSkewActive ? activeButtonClass : inactiveButtonClass}`}
        disabled={isActionDisabled}
        aria-label="Set to Maximum Loss"
      >
        <RightSkewIcon />
        <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 -translate-x-1/2 left-1/2">
          Right-skewed: Most loss events are expected to be closer to the maximum value.
        </div>
      </button>
      <button
        type="button"
        onClick={handleRandomClick}
        className={`group relative ${baseButtonClass} rounded-r-md ${inactiveButtonClass}`}
        disabled={isActionDisabled}
        aria-label="Set to random value"
      >
        <DiceIcon />
        <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 -translate-x-1/2 left-1/2">
          Set a random value between Minimum and Maximum Loss.
        </div>
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
        <InteractiveSlider
          label="Minimum Loss"
          value={min}
          onChange={onMinChange}
          min={1}
          max={max > 1 ? max : SLIDER_MAX}
          logarithmic
          startAdornment="$"
        />

        <div>
            <InteractiveSlider
              label="Maximum Loss"
              value={max}
              onChange={onMaxChange}
              min={min > 1 ? min : 1}
              max={SLIDER_MAX}
              logarithmic
              startAdornment="$"
            />
            {isMaxLessThanMin && <p className="text-red-600 text-xs mt-1">Maximum loss cannot be less than minimum loss.</p>}
        </div>

        <div>
           <InteractiveSlider
              label="Most Likely Loss"
              value={mostLikely}
              onChange={onMostLikelyChange}
              min={min > 1 ? min : 1}
              max={max > min ? max : SLIDER_MAX}
              logarithmic
              disabled={isActionDisabled}
              labelAction={mostLikelyActions}
              startAdornment="$"
            />
           {isMostLikelyOutOfRange && <p className="text-red-600 text-xs mt-1">Most likely loss must be between minimum and maximum loss.</p>}
        </div>
      </div>
  );
};

export default LossMagnitude;