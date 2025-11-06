
import React, { useMemo, useEffect } from 'react';
import { FrequencyPeriod } from '../types';
import InteractiveSlider from './InteractiveSlider';

interface LossFrequencyProps {
  value: number;
  period: FrequencyPeriod;
  onValueChange: (value: number) => void;
  onPeriodChange: (period: FrequencyPeriod) => void;
}

const periods: { name: FrequencyPeriod; description: string }[] = [
    { name: 'Daily', description: 'Occurs once per day' },
    { name: 'Weekly', description: 'Occurs once per week' },
    { name: 'Monthly', description: 'Occurs once per month' },
    { name: 'Annually', description: 'Occurs once per year' },
    { name: 'Biennially', description: 'Occurs every 2 years' },
    { name: 'Quinquennially', description: 'Occurs every 5 years' },
    { name: 'Decennially', description: 'Occurs every 10 years' },
];

const LossFrequency: React.FC<LossFrequencyProps> = ({ value, period, onValueChange, onPeriodChange }) => {

  const sliderMax = useMemo(() => {
    switch(period) {
        case 'Daily': return 10;
        case 'Weekly': return 20;
        case 'Monthly': return 50;
        case 'Annually': return 100;
        case 'Biennially': return 10;
        case 'Quinquennially': return 10;
        case 'Decennially': return 10;
        default: return 100;
    }
  }, [period]);

  useEffect(() => {
    if (value > sliderMax) {
      onValueChange(sliderMax);
    }
  }, [period, sliderMax, value, onValueChange]);

  return (
    <div className="space-y-4">
        <InteractiveSlider
            label="Number of events"
            value={value}
            onChange={onValueChange}
            min={0}
            max={sliderMax}
            step={1}
        />
        <div className="flex flex-wrap gap-1 pt-2">
          {periods.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => onPeriodChange(p.name)}
              className={`group relative px-2.5 py-1 text-xs text-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface ${
                period === p.name
                  ? 'bg-primary text-white shadow'
                  : 'bg-background hover:bg-slate-100 text-text-primary border border-border-color'
              }`}
            >
              {p.name}
              <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 -translate-x-1/2 left-1/2">
                {p.description}
              </div>
            </button>
          ))}
        </div>
      </div>
  );
};

export default LossFrequency;