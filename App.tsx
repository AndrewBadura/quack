
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BASE_METRICS, TEMPORAL_METRICS, ENVIRONMENTAL_METRICS } from './constants';
import { AllMetrics, Scores, Severity, FrequencyPeriod, SimulationResult, MetricGroup, Scenario, Impact } from './types';
import { calculateScores } from './services/cvss';
import { runSimulation } from './services/simulation';
import MetricGroupComponent from './components/MetricGroup';
import ScoreDisplay from './components/ScoreDisplay';
import LossFrequency from './components/LossFrequency';
import LossMagnitude from './components/LossMagnitude';
import RiskSummary from './components/RiskSummary';
import LossExceedanceCurve from './components/LossExceedanceCurve';
import CollapsibleSection from './components/CollapsibleSection';
import InfoTooltip from './components/InfoTooltip';
import ScenarioDefinition from './components/ScenarioDefinition';
import Controls from './components/Controls';
import ScoreIndicator from './components/ScoreIndicator';
import Footer from './components/Footer';

const Logo: React.FC = () => (
  <svg
    className="w-14 h-14"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="QuaCK Logo"
    role="img"
  >
    <g>
      <polygon points="22,6 24,8 20,8" fill="#f8c246"/>
      <polygon points="16,4 22,6 20,8" fill="#93c5fd"/>
      <polygon points="14,14 16,4 20,8" fill="#3b82f6"/>
      <polygon points="21,18 14,14 20,8" fill="#2563eb"/>
      <polygon points="8,20 14,14 21,18" fill="#1d4ed8"/>
      <polygon points="6,15 3,18 8,20" fill="#60a5fa"/>
      <polygon points="14,14 8,20 6,15" fill="#1e40af"/>
    </g>
  </svg>
);


const getInitialMetrics = (metricSet: MetricGroup): AllMetrics => {
  const metrics: AllMetrics = {};
  metricSet.forEach(group => {
    metrics[group.key] = group.options[0].key;
  });
  return metrics;
};

const mapScenarioToCvss = (scenario: Scenario): AllMetrics => {
  const newMetrics: AllMetrics = {
    AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'N', I: 'N', A: 'N'
  };

  // Threat Type & Community -> Exploitability
  switch (scenario.threatType) {
    case 'Adversarial':
      newMetrics.AC = 'L';
      if (scenario.threatCommunity === 'External') {
        newMetrics.AV = 'N';
        newMetrics.PR = 'N';
      } else { // Internal
        newMetrics.AV = 'L';
        newMetrics.PR = 'L';
      }
      break;
    case 'Accidental':
      newMetrics.AC = 'H';
      newMetrics.AV = 'L';
      newMetrics.PR = 'L'; // Assumes an authorized user made a mistake
      break;
    case 'Environmental':
        newMetrics.AV = 'P';
        newMetrics.AC = 'H';
        newMetrics.PR = 'N';
        break;
  }
  
  // Target -> Scope
  if (scenario.target === 'Client' || scenario.target === 'Third Party') {
      newMetrics.S = 'C';
  } else {
      newMetrics.S = 'U';
  }

  // Impact -> Impact
  if (scenario.impacts.Confidentiality) newMetrics.C = 'H';
  if (scenario.impacts.Integrity) newMetrics.I = 'H';
  if (scenario.impacts.Availability) newMetrics.A = 'H';

  return newMetrics;
};

const initialScenario: Scenario = {
  threatType: 'Adversarial',
  threatCommunity: 'External',
  target: 'Firm',
  impacts: {
    Confidentiality: true,
    Integrity: false,
    Availability: false,
  }
};

const App: React.FC = () => {
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [metrics, setMetrics] = useState<AllMetrics>(() => mapScenarioToCvss(scenario));
  const [temporalMetrics, setTemporalMetrics] = useState<AllMetrics>(() => getInitialMetrics(TEMPORAL_METRICS));
  const [environmentalMetrics, setEnvironmentalMetrics] = useState<AllMetrics>(() => getInitialMetrics(ENVIRONMENTAL_METRICS));
  
  const [isScenarioExpanded, setIsScenarioExpanded] = useState(true);
  const [isBaseExpanded, setIsBaseExpanded] = useState(false);
  const [isTemporalExpanded, setIsTemporalExpanded] = useState(false);
  const [isEnvironmentalExpanded, setIsEnvironmentalExpanded] = useState(false);
  const [isFrequencyExpanded, setIsFrequencyExpanded] = useState(true);
  const [isMagnitudeExpanded, setIsMagnitudeExpanded] = useState(true);
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);

  const [likelihoodReduction, setLikelihoodReduction] = useState(25);
  const [confidentialityReduction, setConfidentialityReduction] = useState(50);
  const [integrityReduction, setIntegrityReduction] = useState(10);
  const [availabilityReduction, setAvailabilityReduction] = useState(10);
  const [annualControlCost, setAnnualControlCost] = useState(21500);

  const [scores, setScores] = useState<Scores>({
    baseScore: 0,
    severity: Severity.NONE,
    temporalScore: 0,
    temporalSeverity: Severity.NONE,
    environmentalScore: 0,
    environmentalSeverity: Severity.NONE,
    vectorString: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N',
  });

  const [frequencyValue, setFrequencyValue] = useState<number>(1);
  const [frequencyPeriod, setFrequencyPeriod] = useState<FrequencyPeriod>('Annually');
  const [minLoss, setMinLoss] = useState<number>(1000);
  const [maxLoss, setMaxLoss] = useState<number>(100000);
  const [userMostLikelyLoss, setUserMostLikelyLoss] = useState<number | null>(null);
  
  const [inherentSimulationResults, setInherentSimulationResults] = useState<SimulationResult | null>(null);
  const [residualSimulationResults, setResidualSimulationResults] = useState<SimulationResult | null>(null);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);

  const [costHighlightKey, setCostHighlightKey] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const suppressMetricDerivation = useRef(false);

  const areTemporalMetricsSet = useMemo(() => {
    return temporalMetrics.E !== 'X' || temporalMetrics.RL !== 'X' || temporalMetrics.RC !== 'X';
  }, [temporalMetrics]);

  const areEnvironmentalMetricsSet = useMemo(() => {
    return environmentalMetrics.CR !== 'X' || environmentalMetrics.IR !== 'X' || environmentalMetrics.AR !== 'X';
  }, [environmentalMetrics]);

  const handleReset = useCallback(() => {
    setScenario(initialScenario);
    setMetrics(mapScenarioToCvss(initialScenario));
    setTemporalMetrics(getInitialMetrics(TEMPORAL_METRICS));
    setEnvironmentalMetrics(getInitialMetrics(ENVIRONMENTAL_METRICS));
    setLikelihoodReduction(25);
    setConfidentialityReduction(50);
    setIntegrityReduction(10);
    setAvailabilityReduction(10);
    setAnnualControlCost(21500);
    setFrequencyValue(1);
    setFrequencyPeriod('Annually');
    setMinLoss(1000);
    setMaxLoss(100000);
    setUserMostLikelyLoss(null);
  }, []);
  
  // On scenario change, suggest new CVSS metrics
  useEffect(() => {
    if (suppressMetricDerivation.current) {
        suppressMetricDerivation.current = false;
        return;
    }
    const suggestedMetrics = mapScenarioToCvss(scenario);
    setMetrics(suggestedMetrics);
  }, [scenario]);

  // On initial load, check for a state in the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stateParam = urlParams.get('state');
    if (stateParam) {
      try {
        const decodedState = JSON.parse(atob(decodeURIComponent(stateParam)));
        
        // If loading both scenario and metrics, suppress the derivation effect
        if (decodedState.s && decodedState.m) {
            suppressMetricDerivation.current = true;
        }

        // Validate and set state from URL
        if (decodedState.s) setScenario(decodedState.s);
        if (decodedState.m) setMetrics(decodedState.m);
        if (decodedState.t) setTemporalMetrics(decodedState.t);
        if (decodedState.e) setEnvironmentalMetrics(decodedState.e);

        if (decodedState.f?.v) setFrequencyValue(decodedState.f.v);
        if (decodedState.f?.p) setFrequencyPeriod(decodedState.f.p);
        
        if (decodedState.l?.min) setMinLoss(decodedState.l.min);
        if (decodedState.l?.max) setMaxLoss(decodedState.l.max);
        if (decodedState.l?.ml) setUserMostLikelyLoss(decodedState.l.ml);
        
        if(decodedState.c) {
          if (typeof decodedState.c.lr === 'number') setLikelihoodReduction(decodedState.c.lr);
          if (typeof decodedState.c.cr === 'number') setConfidentialityReduction(decodedState.c.cr);
          if (typeof decodedState.c.ir === 'number') setIntegrityReduction(decodedState.c.ir);
          if (typeof decodedState.c.ar === 'number') setAvailabilityReduction(decodedState.c.ar);
          if (typeof decodedState.c.acc === 'number') setAnnualControlCost(decodedState.c.acc);
        }

        // Clear the URL parameter and path to create a clean state for the user.
        window.history.replaceState({}, document.title, '/');

      } catch (error) {
        console.error("Failed to parse state from URL:", error);
      }
    } else {
        // If no state in URL, set initial metrics from default scenario
        setMetrics(mapScenarioToCvss(scenario));
    }
  }, []); // Empty dependency array to run only once on mount.

  const mostLikelyLoss = useMemo(() => {
    if (userMostLikelyLoss !== null && userMostLikelyLoss >= minLoss && userMostLikelyLoss <= maxLoss && maxLoss >= minLoss) {
        return userMostLikelyLoss;
    }
    if (minLoss > 0 && maxLoss > minLoss) {
        return Math.round(minLoss + (maxLoss - minLoss) / 3);
    }
    return 0;
  }, [minLoss, maxLoss, userMostLikelyLoss]);

  useEffect(() => {
    const allMetrics = { ...metrics, ...temporalMetrics, ...environmentalMetrics };
    const newScores = calculateScores(allMetrics);
    setScores(newScores);
  }, [metrics, temporalMetrics, environmentalMetrics]);

  const handleMetricChange = useCallback((metricKey: string, value: string, group: 'base' | 'temporal' | 'environmental') => {
    switch (group) {
        case 'base':
            setMetrics(prev => ({ ...prev, [metricKey]: value }));
            break;
        case 'temporal':
            setTemporalMetrics(prev => ({ ...prev, [metricKey]: value }));
            break;
        case 'environmental':
            setEnvironmentalMetrics(prev => ({ ...prev, [metricKey]: value }));
            break;
    }
  }, []);

  const handleFrequencyValueChange = useCallback((value: number) => {
    setFrequencyValue(value);
  }, []);

  const handleFrequencyPeriodChange = useCallback((period: FrequencyPeriod) => {
    setFrequencyPeriod(period);
  }, []);

  const handleMinLossChange = useCallback((value: number) => {
    setMinLoss(value);
  }, []);
  const handleMaxLossChange = useCallback((value: number) => {
    setMaxLoss(value);
  }, []);
  const handleMostLikelyLossChange = useCallback((value: number) => {
    setUserMostLikelyLoss(value > 0 ? value : null);
  }, []);

  const handleResetMostLikelyLoss = useCallback(() => {
    setUserMostLikelyLoss(null);
  }, []);

  const handleAnnualControlCostChange = useCallback((value: number) => {
    setAnnualControlCost(value);
    setCostHighlightKey(Date.now());
  }, []);

  const handleShare = useCallback(() => {
    const stateToEncode = {
        s: scenario,
        m: metrics,
        t: temporalMetrics,
        e: environmentalMetrics,
        f: { v: frequencyValue, p: frequencyPeriod },
        l: { min: minLoss, max: maxLoss, ml: userMostLikelyLoss },
        c: { 
          lr: likelihoodReduction, 
          cr: confidentialityReduction, 
          ir: integrityReduction, 
          ar: availabilityReduction,
          acc: annualControlCost,
        },
    };

    const encodedState = btoa(JSON.stringify(stateToEncode));
    
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}?state=${encodeURIComponent(encodedState)}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
        console.error('Failed to copy URL: ', err);
    });
  }, [scenario, metrics, temporalMetrics, environmentalMetrics, frequencyValue, frequencyPeriod, minLoss, maxLoss, userMostLikelyLoss, likelihoodReduction, confidentialityReduction, integrityReduction, availabilityReduction, annualControlCost]);

  // Fix: Moved riskMetrics declaration before its usage in handleExport.
const riskMetrics = useMemo(() => {
    const multipliers: { [key in FrequencyPeriod]: number } = {
      'Daily': 365, 'Weekly': 52, 'Monthly': 12, 'Annually': 1,
      'Biennially': 0.5, 'Quinquennially': 0.2, 'Decennially': 0.1,
    };

    const zeroMetrics = { annualizedFrequency: 0, expectedLoss: 0, annualizedLoss: 0 };
    if (maxLoss < minLoss || minLoss <= 0 || maxLoss <= 0) {
        return { inherent: zeroMetrics, residual: zeroMetrics, reduction: 0, residualParams: { annualizedFrequency: 0, minLoss: 0, maxLoss: 0, mostLikelyLoss: 0 }};
    }

    // --- Inherent Calculation ---
    const inherentAnnualFreq = frequencyValue * multipliers[frequencyPeriod];
    const isValidMostLikely = mostLikelyLoss > 0 && mostLikelyLoss >= minLoss && mostLikelyLoss <= maxLoss;
    const inherentMode = isValidMostLikely ? mostLikelyLoss : (minLoss + (maxLoss - minLoss) / 3);
    const inherentExpectedLoss = !isNaN(inherentMode) ? (minLoss + 4 * inherentMode + maxLoss) / 6 : 0;
    const inherentAnnualLoss = inherentAnnualFreq * inherentExpectedLoss;

    const inherent = {
        annualizedFrequency: inherentAnnualFreq,
        expectedLoss: inherentExpectedLoss,
        annualizedLoss: inherentAnnualLoss,
    };

    // --- Residual Calculation ---
    let totalImpactReduction = 0;
    let activeReductions = 0;

    if (scenario.impacts.Confidentiality) {
        totalImpactReduction += confidentialityReduction;
        activeReductions++;
    }
    if (scenario.impacts.Integrity) {
        totalImpactReduction += integrityReduction;
        activeReductions++;
    }
    if (scenario.impacts.Availability) {
        totalImpactReduction += availabilityReduction;
        activeReductions++;
    }

    const avgImpactReduction = activeReductions > 0 ? totalImpactReduction / activeReductions : 0;
    const impactMultiplier = 1 - (avgImpactReduction / 100);
    const frequencyMultiplier = 1 - (likelihoodReduction / 100);

    const residualParams = {
        annualizedFrequency: inherent.annualizedFrequency * frequencyMultiplier,
        minLoss: minLoss * impactMultiplier,
        maxLoss: maxLoss * impactMultiplier,
        mostLikelyLoss: mostLikelyLoss !== null ? mostLikelyLoss * impactMultiplier : mostLikelyLoss,
    };

    const isValidResidualMostLikely = residualParams.mostLikelyLoss !== null && residualParams.mostLikelyLoss >= residualParams.minLoss && residualParams.mostLikelyLoss <= residualParams.maxLoss;
    const residualMode = isValidResidualMostLikely ? residualParams.mostLikelyLoss : (residualParams.minLoss + (residualParams.maxLoss - residualParams.minLoss) / 3);
    
    const residualExpectedLoss = !isNaN(residualMode) ? (residualParams.minLoss + 4 * residualMode + residualParams.maxLoss) / 6 : 0;
    const residualAnnualLoss = residualParams.annualizedFrequency * residualExpectedLoss;

    const residual = {
        annualizedFrequency: residualParams.annualizedFrequency,
        expectedLoss: residualExpectedLoss,
        annualizedLoss: residualAnnualLoss,
    };
    
    return { inherent, residual, reduction: inherent.annualizedLoss - residual.annualizedLoss, residualParams };
}, [frequencyValue, frequencyPeriod, minLoss, maxLoss, mostLikelyLoss, scenario.impacts, likelihoodReduction, confidentialityReduction, integrityReduction, availabilityReduction]);

  const handleExport = useCallback(() => {
    const getPercentile = (data: number[] | null, percentile: number): number | string => {
        if (!data || data.length === 0) return 'N/A';
        const index = Math.floor(data.length * (1 - percentile / 100));
        const safeIndex = Math.max(0, Math.min(data.length - 1, index));
        return Math.round(data[safeIndex]);
    };

    const rosi = annualControlCost > 0 ? ((riskMetrics.reduction - annualControlCost) / annualControlCost) * 100 : 0;

    const csvRows: (string | number)[][] = [
        ['Category', 'Parameter', 'Value'],
    ];
    
    const addRow = (category: string, parameter: string, value: any) => {
        csvRows.push([category, parameter, value]);
    };
    const addSpacer = () => addRow('', '', '');

    addRow('Scenario Definition', 'Threat Type', scenario.threatType);
    addRow('Scenario Definition', 'Threat Community', scenario.threatCommunity);
    addRow('Scenario Definition', 'Target', scenario.target);
    addRow('Scenario Definition', 'Impact - Confidentiality', scenario.impacts.Confidentiality);
    addRow('Scenario Definition', 'Impact - Integrity', scenario.impacts.Integrity);
    addRow('Scenario Definition', 'Impact - Availability', scenario.impacts.Availability);
    addSpacer();

    addRow('CVSS Scores', 'Vector String', scores.vectorString);
    addRow('CVSS Scores', 'Base Score', scores.baseScore);
    addRow('CVSS Scores', 'Temporal Score', scores.temporalScore);
    addRow('CVSS Scores', 'Environmental Score', scores.environmentalScore);
    addSpacer();

    addRow('Risk Inputs', 'Loss Event Frequency', frequencyValue);
    addRow('Risk Inputs', 'Frequency Period', frequencyPeriod);
    addRow('Risk Inputs', 'Minimum Loss ($)', minLoss);
    addRow('Risk Inputs', 'Maximum Loss ($)', maxLoss);
    addRow('Risk Inputs', 'Most Likely Loss ($)', mostLikelyLoss);
    addSpacer();

    addRow('Security Controls', 'Likelihood Reduction (%)', likelihoodReduction);
    addRow('Security Controls', 'Confidentiality Reduction (%)', confidentialityReduction);
    addRow('Security Controls', 'Integrity Reduction (%)', integrityReduction);
    addRow('Security Controls', 'Availability Reduction (%)', availabilityReduction);
    addRow('Security Controls', 'Annual Control Cost ($)', annualControlCost);
    addSpacer();
    
    addRow('Financial Summary', 'Inherent ALE ($)', Math.round(riskMetrics.inherent.annualizedLoss));
    addRow('Financial Summary', 'Residual ALE ($)', Math.round(riskMetrics.residual.annualizedLoss));
    addRow('Financial Summary', 'Annual Risk Reduction ($)', Math.round(riskMetrics.reduction));
    addRow('Financial Summary', 'ROSI (%)', isFinite(rosi) ? rosi.toFixed(1) : 'N/A');
    addSpacer();

    const addPercentileRows = (title: string, results: SimulationResult | null) => {
        addRow(title, '99th Percentile (P99)', getPercentile(results, 99));
        addRow(title, '95th Percentile (P95)', getPercentile(results, 95));
        addRow(title, '90th Percentile (P90)', getPercentile(results, 90));
        addRow(title, '50th Percentile (Median)', getPercentile(results, 50));
    };

    addPercentileRows('Inherent Risk Simulation (Annual Loss $)', inherentSimulationResults);
    addSpacer();
    addPercentileRows('Residual Risk Simulation (Annual Loss $)', residualSimulationResults);
    addSpacer();

    // Add Raw Simulation Data
    addRow('Simulation Raw Data', '', '');
    csvRows.push(['Iteration', 'Inherent Annual Loss ($)', 'Residual Annual Loss ($)']);

    const numIterations = Math.max(
      inherentSimulationResults?.length ?? 0,
      residualSimulationResults?.length ?? 0
    );

    if (numIterations > 0) {
      for (let i = 0; i < numIterations; i++) {
        const inherentLoss = inherentSimulationResults?.[i];
        const residualLoss = residualSimulationResults?.[i];
        csvRows.push([
          i + 1,
          inherentLoss !== undefined ? Math.round(inherentLoss) : 'N/A',
          residualLoss !== undefined ? Math.round(residualLoss) : 'N/A',
        ]);
      }
    }

    const escapeCsvCell = (cell: any): string => {
        if (cell === null || cell === undefined) {
            return '';
        }
        const stringCell = String(cell);
        if (/[",\n]/.test(stringCell)) {
            return `"${stringCell.replace(/"/g, '""')}"`;
        }
        return stringCell;
    };

    const csvContent = csvRows.map(row => row.map(escapeCsvCell).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "QuaCK-analysis.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [
    scenario, scores, frequencyValue, frequencyPeriod, minLoss, maxLoss, mostLikelyLoss,
    likelihoodReduction, confidentialityReduction, integrityReduction, availabilityReduction,
    annualControlCost, riskMetrics, inherentSimulationResults, residualSimulationResults
  ]);


  useEffect(() => {
    if (riskMetrics.inherent.expectedLoss <= 0) {
      if (inherentSimulationResults !== null) setInherentSimulationResults(null);
      if (residualSimulationResults !== null) setResidualSimulationResults(null);
      return;
    }

    setIsChartLoading(true);

    const handler = setTimeout(() => {
      const inherentResults = runSimulation({
        annualizedFrequency: riskMetrics.inherent.annualizedFrequency,
        minLoss,
        maxLoss,
        mostLikelyLoss,
        iterations: 10000,
      });
      setInherentSimulationResults(inherentResults);

      const residualResults = runSimulation({
        ...riskMetrics.residualParams,
        iterations: 10000,
      });
      setResidualSimulationResults(residualResults);

      setIsChartLoading(false);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [riskMetrics, minLoss, maxLoss, mostLikelyLoss]);

  const monteCarloMethodology = (
    <>
      <strong className="font-semibold text-white">Monte Carlo simulation</strong> is a computational technique that uses random sampling to obtain numerical results.
      <br /><br />
      In this context, we run thousands of simulated 'years', each with a random number of loss events (from the Poisson distribution) and a random loss amount for each event (from the Triangular distribution). The <strong className="font-semibold text-white">Loss Exceedance Curve (LEC)</strong> plots the results, showing the probability of total annual losses exceeding specific amounts. It's a powerful way to visualize and understand the full range of potential outcomes, not just a single average.
    </>
  );

  const frequencyMethodologyText = (
    <>
      We model the frequency of loss events using a{' '}
      <strong className="font-semibold text-white">Poisson distribution</strong>. This is a standard
      statistical method for modeling how many times an event is likely to occur
      over a specific period when the average rate is known and events are
      independent.
    </>
  );

  const magnitudeMethodologyText = (
    <>
      We model the potential financial loss of a single event using a{' '}
      <strong className="font-semibold text-white">Triangular distribution</strong>.
      This distribution is defined by a minimum, maximum, and most likely value,
      making it an intuitive way to represent expert estimates when precise data
      is unavailable.
    </>
  );

  return (
    <div className="min-h-screen bg-background text-text-primary p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <header className="mb-8">
          <div className="bg-surface rounded-xl shadow-lg p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center text-center sm:text-left">
                <Logo />
                <div className="ml-4 sm:ml-6">
                  <h1 className="text-2xl sm:text-4xl font-bold text-text-primary tracking-tight">QuaCK</h1>
                  <p className="text-text-secondary mt-1 text-sm sm:text-base font-medium">Quantify Cyber Knowledge</p>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                   <button 
                    onClick={handleReset}
                    className="inline-flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium bg-white border-border-color text-text-secondary hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface transition-all duration-200"
                    title="Reset all inputs to their default values"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm1 14a1 1 0 011-1h5.001a5.002 5.002 0 004.087-7.966 1 1 0 111.885.666A7.002 7.002 0 015.199 15H5a1 1 0 110-2h.199V16z" clipRule="evenodd" />
                    </svg>
                    Reset
                  </button>
                  <button 
                    onClick={handleExport}
                    className="inline-flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium bg-white border-border-color text-text-secondary hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface transition-all duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Export CSV
                  </button>
                  <button 
                    onClick={handleShare}
                    className={`inline-flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface transition-all duration-200 ${
                      isCopied 
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-white border-border-color text-text-secondary hover:bg-slate-50'
                    }`}
                  >
                      {isCopied ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Share Analysis
                        </>
                      )}
                  </button>
              </div>
            </div>
            <p className="text-text-secondary mt-6 text-sm leading-relaxed">
              This tool helps you quantify cybersecurity risk in financial terms. Start by defining a risk scenario and its technical severity using CVSS metrics. Next, estimate the potential financial impact and frequency, then model your security controls to understand their effect on risk reduction. The tool will then run a Monte Carlo simulation, generating a Loss Exceedance Curve to visualize the full range of potential outcomes for both inherent and residual risk, and calculate the return on your security investment (ROSI).
            </p>
          </div>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <CollapsibleSection title="Risk Scenario" isOpen={isScenarioExpanded} onToggle={() => setIsScenarioExpanded(prev => !prev)}>
                <ScenarioDefinition scenario={scenario} onScenarioChange={setScenario} />
            </CollapsibleSection>
            <CollapsibleSection 
              title="Base Metrics (CVSS)" 
              isOpen={isBaseExpanded} 
              onToggle={() => setIsBaseExpanded(prev => !prev)}
              headerContent={<ScoreIndicator score={scores.baseScore} severity={scores.severity as Severity} />}
            >
                 {BASE_METRICS.map(metric => (
                  <MetricGroupComponent 
                      key={metric.key} 
                      metric={metric} 
                      selectedValue={metrics[metric.key]} 
                      onValueChange={(key, value) => handleMetricChange(key, value, 'base')}
                  />
                ))}
            </CollapsibleSection>
            <CollapsibleSection 
              title="Temporal Metrics" 
              isOpen={isTemporalExpanded} 
              onToggle={() => setIsTemporalExpanded(prev => !prev)}
              headerContent={areTemporalMetricsSet ? (
                <ScoreIndicator score={scores.temporalScore} severity={scores.temporalSeverity as Severity} />
              ) : (
                <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">N/A</div>
              )}
            >
                 {TEMPORAL_METRICS.map(metric => (
                  <MetricGroupComponent 
                      key={metric.key} 
                      metric={metric} 
                      selectedValue={temporalMetrics[metric.key]} 
                      onValueChange={(key, value) => handleMetricChange(key, value, 'temporal')}
                  />
                ))}
            </CollapsibleSection>
            <CollapsibleSection 
              title="Environmental Metrics" 
              isOpen={isEnvironmentalExpanded} 
              onToggle={() => setIsEnvironmentalExpanded(prev => !prev)}
              headerContent={areEnvironmentalMetricsSet ? (
                <ScoreIndicator score={scores.environmentalScore} severity={scores.environmentalSeverity as Severity} />
              ) : (
                <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">N/A</div>
              )}
            >
                 {ENVIRONMENTAL_METRICS.map(metric => (
                  <MetricGroupComponent 
                      key={metric.key} 
                      metric={metric} 
                      selectedValue={environmentalMetrics[metric.key]} 
                      onValueChange={(key, value) => handleMetricChange(key, value, 'environmental')}
                  />
                ))}
            </CollapsibleSection>
            <ScoreDisplay scores={scores} />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <CollapsibleSection 
                title="Loss Event Frequency"
                isOpen={isFrequencyExpanded}
                onToggle={() => setIsFrequencyExpanded(p => !p)}
                headerContent={<InfoTooltip text={frequencyMethodologyText} />}
            >
                <LossFrequency 
                    value={frequencyValue}
                    period={frequencyPeriod}
                    onValueChange={handleFrequencyValueChange}
                    onPeriodChange={handleFrequencyPeriodChange}
                />
            </CollapsibleSection>
            <CollapsibleSection
                title="Loss Magnitude ($)"
                isOpen={isMagnitudeExpanded}
                onToggle={() => setIsMagnitudeExpanded(p => !p)}
                headerContent={<InfoTooltip text={magnitudeMethodologyText} />}
            >
                <LossMagnitude
                    min={minLoss}
                    max={maxLoss}
                    mostLikely={mostLikelyLoss}
                    userMostLikelyLoss={userMostLikelyLoss}
                    onMinChange={handleMinLossChange}
                    onMaxChange={handleMaxLossChange}
                    onMostLikelyChange={handleMostLikelyLossChange}
                    onResetMostLikely={handleResetMostLikelyLoss}
                />
            </CollapsibleSection>
             
             <Controls
              isOpen={isControlsExpanded}
              onToggle={() => setIsControlsExpanded(prev => !prev)}
              impacts={scenario.impacts}
              likelihoodReduction={likelihoodReduction}
              onLikelihoodReductionChange={setLikelihoodReduction}
              confidentialityReduction={confidentialityReduction}
              onConfidentialityReductionChange={setConfidentialityReduction}
              integrityReduction={integrityReduction}
              onIntegrityReductionChange={setIntegrityReduction}
              availabilityReduction={availabilityReduction}
              onAvailabilityReductionChange={setAvailabilityReduction}
              annualControlCost={annualControlCost}
              onAnnualControlCostChange={handleAnnualControlCostChange}
            />

             <div className="bg-surface p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-text-primary border-b border-border-color pb-3 mb-4">
                    Simulation: Loss Exceedance Curve
                    <InfoTooltip text={monteCarloMethodology} />
                </h2>
                <p className="text-text-secondary mb-6 text-sm">
                    We've run thousands of simulations based on your inputs to answer the question: "What is the probability (%) of losing more than a specific dollar amount ($) in one year?"
                </p>

                <div className="mt-8 h-96">
                   <LossExceedanceCurve 
                    inherentResults={inherentSimulationResults} 
                    residualResults={residualSimulationResults}
                    isLoading={isChartLoading} 
                   />
                </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="lg:sticky lg:top-8 space-y-6">
                <RiskSummary 
                    inherentALE={riskMetrics.inherent.annualizedLoss}
                    residualALE={riskMetrics.residual.annualizedLoss}
                    riskReduction={riskMetrics.reduction}
                    annualControlCost={annualControlCost}
                    costHighlightKey={costHighlightKey}
                />
            </div>
          </div>

        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;
