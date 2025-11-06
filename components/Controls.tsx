
import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import InteractiveSlider from './InteractiveSlider';
import InfoTooltip from './InfoTooltip';
import { Impact } from '../types';

interface ControlsProps {
  isOpen: boolean;
  onToggle: () => void;
  impacts: { [key in Impact]: boolean };
  likelihoodReduction: number;
  onLikelihoodReductionChange: (value: number) => void;
  confidentialityReduction: number;
  onConfidentialityReductionChange: (value: number) => void;
  integrityReduction: number;
  onIntegrityReductionChange: (value: number) => void;
  availabilityReduction: number;
  onAvailabilityReductionChange: (value: number) => void;
  annualControlCost: number;
  onAnnualControlCostChange: (value: number) => void;
}

const Controls: React.FC<ControlsProps> = (props) => {
  const {
    isOpen,
    onToggle,
    impacts,
    likelihoodReduction,
    onLikelihoodReductionChange,
    confidentialityReduction,
    onConfidentialityReductionChange,
    integrityReduction,
    onIntegrityReductionChange,
    availabilityReduction,
    onAvailabilityReductionChange,
    annualControlCost,
    onAnnualControlCostChange,
  } = props;
  
  const methodologyText = (
    <>
      Model the effectiveness of your security controls. Controls can reduce the{' '}
      <strong className="font-semibold text-white">likelihood (frequency)</strong> of a loss event occurring,
      or mitigate the <strong className="font-semibold text-white">impact (magnitude)</strong> of an event if it does occur.
      <br /><br />
      Set each slider to the percentage by which you believe your controls reduce risk in that area.
    </>
  );

  return (
    <CollapsibleSection 
      title="Security Controls" 
      isOpen={isOpen} 
      onToggle={onToggle}
      headerContent={<InfoTooltip text={methodologyText} />}
    >
      <div className="space-y-4">
        <InteractiveSlider
          label="Likelihood Reduction"
          value={likelihoodReduction}
          onChange={onLikelihoodReductionChange}
          min={0}
          max={100}
          step={1}
          endAdornment="%"
        />
        <InteractiveSlider
          label="Confidentiality Impact Mitigation"
          value={confidentialityReduction}
          onChange={onConfidentialityReductionChange}
          min={0}
          max={100}
          step={1}
          endAdornment="%"
          disabled={!impacts.Confidentiality}
        />
        <InteractiveSlider
          label="Integrity Impact Mitigation"
          value={integrityReduction}
          onChange={onIntegrityReductionChange}
          min={0}
          max={100}
          step={1}
          endAdornment="%"
          disabled={!impacts.Integrity}
        />
        <InteractiveSlider
          label="Availability Impact Mitigation"
          value={availabilityReduction}
          onChange={onAvailabilityReductionChange}
          min={0}
          max={100}
          step={1}
          endAdornment="%"
          disabled={!impacts.Availability}
        />
        <div className="pt-2">
            <h4 className="text-sm font-medium text-text-secondary tracking-wider border-t border-border-color pt-4 mb-4">
                Control Investment
            </h4>
            <InteractiveSlider
                label="Annual Cost of Controls"
                value={annualControlCost}
                onChange={onAnnualControlCostChange}
                min={0}
                max={10000000}
                step={100}
                logarithmic
                startAdornment="$"
            />
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default Controls;