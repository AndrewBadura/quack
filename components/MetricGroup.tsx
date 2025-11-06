
import React from 'react';
import { Metric } from '../types';

interface MetricGroupProps {
  metric: Metric;
  selectedValue: string;
  onValueChange: (metricKey: string, value: string) => void;
}

const MetricGroupComponent: React.FC<MetricGroupProps> = ({ metric, selectedValue, onValueChange }) => {

  return (
    <div className="mb-5">
      <h3 className="text-sm font-medium text-text-primary mb-2">{metric.name}</h3>
      <div className="flex w-full rounded-md border border-border-color" role="radiogroup">
        {metric.options.map((option, index) => {
          const isSelected = selectedValue === option.key;

          const optionClasses = `
            group relative grow text-center px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer
            focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary
            ${index > 0 ? 'border-l border-border-color' : ''}
            ${isSelected
              ? 'bg-primary text-white'
              : 'bg-white hover:bg-slate-50 text-text-primary'}
          `;

          const { length } = metric.options;
          const isFirst = index === 0;
          const isLast = index === length - 1;
          const isSecond = index === 1;
          const isSecondToLast = index === length - 2;

          let tooltipPositionClasses = 'left-1/2 -translate-x-1/2'; // Default: center

          if (length > 2) {
            if (isFirst || (isSecond && length > 3)) {
              // Align left for the first item, and the second item if there are 4+ options
              tooltipPositionClasses = 'left-0';
            } else if (isLast || (isSecondToLast && length > 3)) {
              // Align right for the last item, and second-to-last if there are 4+ options
              tooltipPositionClasses = 'right-0';
            }
          }

          return (
            <label key={option.key} className={optionClasses}>
              <input
                type="radio"
                name={metric.key}
                value={option.key}
                checked={isSelected}
                onChange={() => onValueChange(metric.key, option.key)}
                className="absolute opacity-0 w-0 h-0"
              />
              <span>{option.name}</span>
              <div className={`absolute bottom-full mb-2 w-72 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${tooltipPositionClasses}`}>
                <p className="font-semibold mb-1">{option.name}</p>
                {option.description}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default MetricGroupComponent;
