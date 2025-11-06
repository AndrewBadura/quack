

import React from 'react';
import { Scores, Severity } from '../types';

interface ScoreDisplayProps {
  scores: Scores;
}

const severityStyles: { [key in Severity]: string } = {
  [Severity.NONE]: 'bg-cvss-none text-white',
  [Severity.LOW]: 'bg-cvss-low text-black',
  [Severity.MEDIUM]: 'bg-cvss-medium text-white',
  [Severity.HIGH]: 'bg-cvss-high text-white',
  [Severity.CRITICAL]: 'bg-cvss-critical text-white',
};

const getSeverityTextColor = (severity: Severity) => {
    switch(severity) {
        case Severity.NONE: return 'text-cvss-none';
        case Severity.LOW: return 'text-cvss-low';
        case Severity.MEDIUM: return 'text-cvss-medium';
        case Severity.HIGH: return 'text-cvss-high';
        case Severity.CRITICAL: return 'text-cvss-critical';
        default: return 'text-text-primary';
    }
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ scores }) => {
  const { baseScore, severity, temporalScore, temporalSeverity, environmentalScore, environmentalSeverity, vectorString } = scores;

  const isTemporalSet = temporalScore !== baseScore;
  const isEnvironmentalSet = environmentalScore !== baseScore;

  const displayScore = isEnvironmentalSet ? environmentalScore : (isTemporalSet ? temporalScore : baseScore);
  const displaySeverity = isEnvironmentalSet ? environmentalSeverity : (isTemporalSet ? temporalSeverity : severity);
  const displayLabel = isEnvironmentalSet ? 'Environmental Score' : (isTemporalSet ? 'Temporal Score' : 'Base Score');
  
  const nistBaseUrl = 'https://nvd.nist.gov/vuln-metrics/cvss/v3-calculator';
  const vectorParam = vectorString.replace(/^CVSS:3\.1\//, '');
  const nistUrl = `${nistBaseUrl}?vector=${encodeURIComponent(vectorParam)}&version=3.1`;

  return (
    <div className="bg-surface rounded-xl shadow-lg p-6 text-center">
      <span className="text-sm font-medium text-text-secondary tracking-wider">{displayLabel}</span>
      <div className={`my-4 py-8 rounded-lg ${severityStyles[displaySeverity as Severity] || 'bg-gray-500 text-white'}`}>
        <span className="text-8xl font-bold">{displayScore.toFixed(1)}</span>
        <span className={`block text-3xl font-semibold mt-1`}>
            {displaySeverity}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 divide-x divide-border-color bg-primary-light p-3 rounded-lg">
          <div className="px-2">
              <p className="text-sm text-text-secondary">Base</p>
              <p className={`font-bold text-xl ${getSeverityTextColor(severity as Severity)}`}>{baseScore.toFixed(1)}</p>
          </div>
          <div className="px-2">
              <p className="text-sm text-text-secondary">Temporal</p>
              <p className={`font-bold text-xl ${isTemporalSet ? getSeverityTextColor(temporalSeverity as Severity) : 'text-text-primary'}`}>{temporalScore.toFixed(1)}</p>
          </div>
          <div className="px-2">
              <p className="text-sm text-text-secondary">Environmental</p>
              <p className={`font-bold text-xl ${isEnvironmentalSet ? getSeverityTextColor(environmentalSeverity as Severity) : 'text-text-primary'}`}>{environmentalScore.toFixed(1)}</p>
          </div>
      </div>
      
      <div className="mt-6 text-left">
          <h3 className="text-sm font-medium text-text-secondary tracking-wider mb-2">Vector String</h3>
          <a
            href={nistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group font-mono text-primary bg-primary-light p-3 rounded-md break-all text-sm block hover:bg-blue-100 transition-colors"
            title="Open in NIST CVSS Calculator"
          >
            <span className="group-hover:underline">{vectorString}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-2 opacity-70 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
      </div>
    </div>
  );
};

export default ScoreDisplay;