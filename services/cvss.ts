
import { AllMetrics, Scores, Severity } from '../types';

const CVSS_VERSION = "3.1";

const METRIC_WEIGHTS = {
  AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  AC: { H: 0.44, L: 0.77 },
  PR: { N: 0.85, L: 0.62, H: 0.27 }, // Scope Unchanged
  PR_C: { N: 0.85, L: 0.68, H: 0.5 }, // Scope Changed
  UI: { N: 0.85, R: 0.62 },
  S: { U: 6.42, C: 7.52 },
  C: { N: 0, L: 0.22, H: 0.56 },
  I: { N: 0, L: 0.22, H: 0.56 },
  A: { N: 0, L: 0.22, H: 0.56 },
  E: { X: 1, U: 0.91, P: 0.94, F: 0.97, H: 1 },
  RL: { X: 1, O: 0.95, T: 0.96, W: 0.97, U: 1 },
  RC: { X: 1, U: 0.92, R: 0.96, C: 1 },
  CR: { X: 1, L: 0.5, M: 1, H: 1.5 },
  IR: { X: 1, L: 0.5, M: 1, H: 1.5 },
  AR: { X: 1, L: 0.5, M: 1, H: 1.5 },
};

function roundUp(value: number): number {
  const rounded = Math.round(value * 100000);
  return Math.ceil(rounded / 10000) / 10;
}


function getSeverity(score: number): Severity {
  if (score === 0) {
    return Severity.NONE;
  } else if (score >= 0.1 && score <= 3.9) {
    return Severity.LOW;
  } else if (score >= 4.0 && score <= 6.9) {
    return Severity.MEDIUM;
  } else if (score >= 7.0 && score <= 8.9) {
    return Severity.HIGH;
  } else {
    return Severity.CRITICAL;
  }
}

export function calculateScores(metrics: AllMetrics): Scores {
  // --- Base Score ---
  const scopeChanged = metrics.S === 'C';
  
  const impactSubScore = 1 - (
    (1 - METRIC_WEIGHTS.C[metrics.C]) * 
    (1 - METRIC_WEIGHTS.I[metrics.I]) * 
    (1 - METRIC_WEIGHTS.A[metrics.A])
  );

  let impact: number;
  if (!scopeChanged) {
    impact = METRIC_WEIGHTS.S.U * impactSubScore;
  } else {
    impact = METRIC_WEIGHTS.S.C * (impactSubScore - 0.029) - 3.25 * Math.pow(impactSubScore - 0.02, 15);
  }

  const privilegesRequiredWeight = scopeChanged ? METRIC_WEIGHTS.PR_C[metrics.PR] : METRIC_WEIGHTS.PR[metrics.PR];
  
  const exploitability = 8.22 * 
    METRIC_WEIGHTS.AV[metrics.AV] * 
    METRIC_WEIGHTS.AC[metrics.AC] * 
    privilegesRequiredWeight * 
    METRIC_WEIGHTS.UI[metrics.UI];
    
  let baseScore: number;
  if (impact <= 0) {
    baseScore = 0;
  } else {
    if (!scopeChanged) {
      baseScore = roundUp(Math.min(impact + exploitability, 10));
    } else {
      baseScore = roundUp(Math.min(1.08 * (impact + exploitability), 10));
    }
  }
  const severity = getSeverity(baseScore);

  // --- Temporal Score ---
  const temporalScore = roundUp(
    baseScore *
    METRIC_WEIGHTS.E[metrics.E] *
    METRIC_WEIGHTS.RL[metrics.RL] *
    METRIC_WEIGHTS.RC[metrics.RC]
  );
  const temporalSeverity = getSeverity(temporalScore);

  // --- Environmental Score ---
  const anySecurityRequirementsSet = metrics.CR !== 'X' || metrics.IR !== 'X' || metrics.AR !== 'X';
  let environmentalScore: number;
  let environmentalSeverity: Severity;

  if (!anySecurityRequirementsSet) {
    // If no security requirements are defined, the Environmental Score is the same as the Temporal Score.
    environmentalScore = temporalScore;
    environmentalSeverity = temporalSeverity;
  } else {
    // If security requirements are defined, we recalculate the score.
    // Per the spec, if modified metrics are not provided, they default to the base metrics.
    const MAV = metrics.MAV || metrics.AV;
    const MAC = metrics.MAC || metrics.AC;
    const MPR = metrics.MPR || metrics.PR;
    const MUI = metrics.MUI || metrics.UI;
    const MS = metrics.MS || metrics.S;
    const MC = metrics.MC || metrics.C;
    const MI = metrics.MI || metrics.I;
    const MA = metrics.MA || metrics.A;

    // 1. Calculate Modified Exploitability
    const modifiedScopeChanged = MS === 'C';
    const modifiedPrivilegesRequiredWeight = modifiedScopeChanged 
        ? METRIC_WEIGHTS.PR_C[MPR] 
        : METRIC_WEIGHTS.PR[MPR];

    const modifiedExploitability = 8.22 * 
      METRIC_WEIGHTS.AV[MAV] * 
      METRIC_WEIGHTS.AC[MAC] * 
      modifiedPrivilegesRequiredWeight * 
      METRIC_WEIGHTS.UI[MUI];

    // 2. Calculate Modified Impact
    const modifiedImpactSubScore = Math.min(
        1 - (
        (1 - METRIC_WEIGHTS.C[MC] * METRIC_WEIGHTS.CR[metrics.CR]) *
        (1 - METRIC_WEIGHTS.I[MI] * METRIC_WEIGHTS.IR[metrics.IR]) *
        (1 - METRIC_WEIGHTS.A[MA] * METRIC_WEIGHTS.AR[metrics.AR])
        ), 0.915
    );

    let modifiedImpact: number;
    if (!modifiedScopeChanged) {
        modifiedImpact = METRIC_WEIGHTS.S.U * modifiedImpactSubScore;
    } else {
        modifiedImpact = METRIC_WEIGHTS.S.C * (modifiedImpactSubScore - 0.029) - 3.25 * Math.pow(modifiedImpactSubScore - 0.02, 15);
    }
    
    // 3. Calculate Modified Base Score
    let modifiedBaseScore: number;
    if (modifiedImpact <= 0) {
        modifiedBaseScore = 0;
    } else {
        if (!modifiedScopeChanged) {
            modifiedBaseScore = roundUp(Math.min(modifiedImpact + modifiedExploitability, 10));
        } else {
            modifiedBaseScore = roundUp(Math.min(1.08 * (modifiedImpact + modifiedExploitability), 10));
        }
    }
    
    // 4. Calculate Final Environmental Score by applying temporal modifiers
    environmentalScore = roundUp(
        modifiedBaseScore *
        METRIC_WEIGHTS.E[metrics.E] *
        METRIC_WEIGHTS.RL[metrics.RL] *
        METRIC_WEIGHTS.RC[metrics.RC]
    );
    environmentalSeverity = getSeverity(environmentalScore);
  }

  // --- Vector String ---
  const vectorPrefix = `CVSS:${CVSS_VERSION}`;
  const orderedBaseMetrics = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'];
  const orderedTemporalMetrics = ['E', 'RL', 'RC'];
  const orderedEnvironmentalMetrics = ['CR', 'IR', 'AR'];
  const orderedModifiedMetrics = ['MAV', 'MAC', 'MPR', 'MUI', 'MS', 'MC', 'MI', 'MA'];

  const vectorParts: string[] = [];

  // Base Metrics
  orderedBaseMetrics.forEach(key => {
    if (metrics[key]) {
      vectorParts.push(`${key}:${metrics[key]}`);
    }
  });

  // Temporal Metrics
  const anyTemporalMetricSet = orderedTemporalMetrics.some(key => metrics[key] && metrics[key] !== 'X');
  if (anyTemporalMetricSet) {
    orderedTemporalMetrics.forEach(key => {
      // If any temporal metric is set, all of them must be included in the vector.
      if (metrics[key]) {
        vectorParts.push(`${key}:${metrics[key]}`);
      }
    });
  }

  // Environmental Metrics (Security Requirements) and Modified Base Metrics
  const anyEnvironmentalMetricSet = orderedEnvironmentalMetrics.some(key => metrics[key] && metrics[key] !== 'X');
  if (anyEnvironmentalMetricSet) {
    // If any security requirement is set, all of them must be included.
    orderedEnvironmentalMetrics.forEach(key => {
      if (metrics[key]) {
        vectorParts.push(`${key}:${metrics[key]}`);
      }
    });

    // Modified Base Metrics are only included if any environmental security requirements are set.
    orderedModifiedMetrics.forEach(mKey => {
      const baseKey = mKey.substring(1); // e.g., MAV -> AV
      const baseValue = metrics[baseKey];
      // Since there's no UI to set modified metrics, their value is the same as the base metric.
      // The CVSS v3.1 spec requires them to be present if security requirements are set.
      if (baseValue) {
        vectorParts.push(`${mKey}:${baseValue}`);
      }
    });
  }

  const vectorString = `${vectorPrefix}/${vectorParts.join('/')}`;

  return {
    baseScore: parseFloat(baseScore.toFixed(1)),
    severity,
    temporalScore: parseFloat(temporalScore.toFixed(1)),
    temporalSeverity,
    environmentalScore: parseFloat(environmentalScore.toFixed(1)),
    environmentalSeverity,
    vectorString
  };
}
