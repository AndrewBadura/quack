import React from 'react';
import { Severity } from '../types';

interface ScoreIndicatorProps {
  score: number;
  severity: Severity;
}

const severityStyles: { [key in Severity]: string } = {
  [Severity.NONE]: 'bg-cvss-none text-white',
  [Severity.LOW]: 'bg-cvss-low text-black',
  [Severity.MEDIUM]: 'bg-cvss-medium text-white',
  [Severity.HIGH]: 'bg-cvss-high text-white',
  [Severity.CRITICAL]: 'bg-cvss-critical text-white',
};

const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({ score, severity }) => {
  if (score === null || !severity) {
    return null;
  }

  return (
    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 ${severityStyles[severity] || 'bg-gray-500 text-white'}`}>
      <span>{score.toFixed(1)}</span>
      <span>{severity}</span>
    </div>
  );
};

export default ScoreIndicator;
