export interface MetricOption {
  key: string;
  name: string;
  description: string;
}

export interface Metric {
  key: string;
  name: string;
  options: MetricOption[];
}

export type MetricGroup = Metric[];

export type AllMetrics = {
  [key: string]: string;
};

export interface Scores {
  baseScore: number;
  severity: string;
  temporalScore: number;
  temporalSeverity: string;
  environmentalScore: number;
  environmentalSeverity: string;
  vectorString: string;
}

export enum Severity {
  NONE = 'None',
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export type FrequencyPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'Annually' | 'Biennially' | 'Quinquennially' | 'Decennially';

export type SimulationResult = number[];

// --- Scenario Types ---
export type ThreatType = 'Adversarial' | 'Accidental' | 'Environmental';
export type ThreatCommunity = 'Internal' | 'External' | 'N/A';
export type Target = 'Firm' | 'Client' | 'Third Party';
export type Impact = 'Confidentiality' | 'Integrity' | 'Availability';

export interface Scenario {
  threatType: ThreatType;
  threatCommunity: ThreatCommunity;
  target: Target;
  impacts: {
    [key in Impact]: boolean;
  };
}