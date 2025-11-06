
import React, { useState, useEffect, useMemo } from 'react';
import InfoTooltip from './InfoTooltip';

interface InteractiveSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  logarithmic?: boolean;
  info?: string;
  disabled?: boolean;
  labelAction?: React.ReactNode;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

const InteractiveSlider: React.FC<InteractiveSliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  logarithmic = false,
  info,
  disabled = false,
  labelAction,
  startAdornment,
  endAdornment,
}) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Update input from prop value only if not focused
    if (!isFocused) {
      setInputValue(value === 0 && !logarithmic ? '' : value.toLocaleString());
    }
  }, [value, isFocused, logarithmic]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);
    const numValue = parseInt(rawValue.replace(/,/g, ''), 10);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange(numValue);
    } else if (rawValue === '') {
      onChange(0);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    const validMax = max > 0 ? max : Infinity;
    const clampedValue = Math.min(Math.max(value, min), validMax);

    if (clampedValue !== value) {
      onChange(clampedValue);
    } else {
      // Re-format if value hasn't changed but input text might be unformatted
      setInputValue(clampedValue === 0 && !logarithmic ? '' : clampedValue.toLocaleString());
    }
  };
  
  const handleInputFocus = () => {
    setIsFocused(true);
    // Unformat number on focus for easier editing
    setInputValue(value === 0 && !logarithmic ? '' : value.toString());
  };

  // For logarithmic slider
  const minLog = useMemo(() => (logarithmic ? Math.log(Math.max(1, min)) : min), [min, logarithmic]);
  const maxLog = useMemo(() => (logarithmic ? Math.log(Math.max(1, max)) : max), [max, logarithmic]);
  
  // Value for the slider should be clamped to its min/max for display purposes
  const clampedSliderValue = Math.max(min, Math.min(value, max > 0 ? max : value));

  const sliderPositionValue = useMemo(() => {
    if (disabled || value <= 0) return logarithmic ? minLog : min;
    
    // Use the clamped value for the slider's position calculation
    const valueForSlider = logarithmic ? clampedSliderValue : value;

    if (logarithmic) {
      if (valueForSlider <= 0) return minLog;
      return Math.log(valueForSlider);
    }
    // For linear scale, the value prop can go beyond max, but the range input will clamp it.
    return value;
  }, [value, clampedSliderValue, min, minLog, logarithmic, disabled]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const sliderVal = parseFloat(e.target.value);
    if (logarithmic) {
      const logValue = Math.exp(sliderVal);
      onChange(Math.round(logValue));
    } else {
      onChange(sliderVal);
    }
  };
  
  const sliderProgress = useMemo(() => {
      const currentMax = logarithmic ? maxLog : max;
      const currentMin = logarithmic ? minLog : min;
      const range = currentMax - currentMin;
      if (range <= 0) return '0%';

      // Use the calculated slider position value for progress
      const progress = ((sliderPositionValue - currentMin) / range) * 100;
      return `${Math.max(0, Math.min(100, progress))}%`;
  }, [sliderPositionValue, max, maxLog, min, minLog, logarithmic]);


  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-text-primary flex items-center">
          {label}
          {info && <InfoTooltip text={info} />}
        </label>
        {labelAction}
      </div>
      <div className="flex items-center space-x-2">
        <div className="relative w-full flex items-center">
            <input
              type="range"
              value={sliderPositionValue}
              onChange={handleSliderChange}
              min={logarithmic ? minLog : min}
              max={logarithmic ? maxLog : max}
              step={logarithmic ? (maxLog - minLog) / 1000 : step}
              disabled={disabled}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-thumb"
              style={{
                background: disabled 
                    ? '#e2e8f0' 
                    : `linear-gradient(to right, #3b82f6 ${sliderProgress}, #e2e8f0 ${sliderProgress})`
              }}
            />
        </div>
        <div className="relative w-28">
            {startAdornment && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                    {startAdornment}
                </div>
            )}
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              disabled={disabled}
              placeholder={logarithmic ? "e.g., 1,000" : "e.g., 5"}
              className={`w-28 p-2 border border-border-color rounded-md shadow-sm focus:ring-primary focus:border-primary text-text-primary bg-background text-right disabled:bg-slate-100 ${startAdornment ? 'pl-7' : ''} ${endAdornment ? 'pr-7' : ''}`}
            />
            {endAdornment && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-secondary">
                    {endAdornment}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveSlider;
