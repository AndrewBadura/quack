import React, { useEffect } from 'react';
import { Scenario, ThreatType, ThreatCommunity, Target, Impact } from '../types';
import { SCENARIO_OPTIONS } from '../scenarioConstants';

interface ScenarioDefinitionProps {
    scenario: Scenario;
    onScenarioChange: (scenario: Scenario) => void;
}

const FormRow: React.FC<{ label: string; children: React.ReactNode; description?: string; }> = ({ label, children, description }) => (
    <div>
        <div className="flex items-baseline justify-between">
            <label className="block text-sm font-medium text-text-secondary">{label}</label>
            {description && <span className="text-xs text-text-secondary">{description}</span>}
        </div>
        <div className="mt-2">
            {children}
        </div>
    </div>
);

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);


const ScenarioDefinition: React.FC<ScenarioDefinitionProps> = ({ scenario, onScenarioChange }) => {
    
    // This effect handles the logic for dependent options.
    useEffect(() => {
        let community: ThreatCommunity = scenario.threatCommunity;
        if (scenario.threatType === 'Environmental' && community !== 'N/A') {
            community = 'N/A';
        } else if (scenario.threatType === 'Accidental' && community === 'External') {
            community = 'Internal';
        } else if (scenario.threatType === 'Adversarial' && community === 'N/A') {
            community = 'External';
        }

        if (community !== scenario.threatCommunity) {
            onScenarioChange({ ...scenario, threatCommunity: community });
        }
    }, [scenario.threatType, scenario.threatCommunity, onScenarioChange, scenario]);

    const handleSingleSelectChange = <K extends keyof Pick<Scenario, 'threatType' | 'threatCommunity' | 'target'>>(key: K, value: Scenario[K]) => {
        onScenarioChange({ ...scenario, [key]: value });
    };

    const handleImpactChange = (impact: Impact) => {
        onScenarioChange({
            ...scenario,
            impacts: {
                ...scenario.impacts,
                [impact]: !scenario.impacts[impact],
            }
        });
    };
    
    const getCommunityOptions = () => {
        switch (scenario.threatType) {
            case 'Adversarial':
                return SCENARIO_OPTIONS.threatCommunities.filter(o => o.value !== 'N/A');
            case 'Accidental':
                return SCENARIO_OPTIONS.threatCommunities.filter(o => o.value === 'Internal');
            case 'Environmental':
                return SCENARIO_OPTIONS.threatCommunities.filter(o => o.value === 'N/A');
            default:
                return SCENARIO_OPTIONS.threatCommunities;
        }
    };
    
    const communityOptions = getCommunityOptions();
    const isCommunityDisabled = communityOptions.length <= 1;
    
    const getButtonClasses = (isActive: boolean, isFirst: boolean, isDisabled: boolean = false) => {
        const baseClasses = `
            group relative grow text-center px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer
            focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary
            disabled:cursor-not-allowed disabled:opacity-50
        `;
        const borderClass = isFirst ? '' : 'border-l border-border-color';
        const stateClasses = isActive
            ? 'bg-primary text-white shadow'
            : 'bg-white hover:bg-slate-50 text-text-primary disabled:bg-slate-100';
        return `${baseClasses} ${borderClass} ${stateClasses}`;
    };

    const getImpactButtonClasses = (isActive: boolean, isFirst: boolean) => {
         const baseClasses = `
            group relative grow text-center px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer
            focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary flex items-center justify-center
        `;
        const borderClass = isFirst ? '' : 'border-l border-border-color';
        const stateClasses = isActive
            ? 'bg-primary-light text-primary'
            : 'bg-white hover:bg-slate-50 text-text-primary';
        return `${baseClasses} ${borderClass} ${stateClasses}`;
    };

    return (
        <div className="space-y-4">
            <FormRow label="Threat Type">
                <div className="flex w-full rounded-md border border-border-color" role="radiogroup">
                    {SCENARIO_OPTIONS.threatTypes.map((opt, index) => (
                        <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={scenario.threatType === opt.value}
                            onClick={() => handleSingleSelectChange('threatType', opt.value)}
                            className={getButtonClasses(scenario.threatType === opt.value, index === 0)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </FormRow>
            
            <FormRow label="Threat Community">
                <div className="flex w-full rounded-md border border-border-color" role="radiogroup">
                    {communityOptions.map((opt, index) => (
                         <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={scenario.threatCommunity === opt.value}
                            onClick={() => handleSingleSelectChange('threatCommunity', opt.value)}
                            className={getButtonClasses(scenario.threatCommunity === opt.value, index === 0, isCommunityDisabled)}
                            disabled={isCommunityDisabled}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </FormRow>

            <FormRow label="Target">
                 <div className="flex w-full rounded-md border border-border-color" role="radiogroup">
                    {SCENARIO_OPTIONS.targets.map((opt, index) => (
                        <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={scenario.target === opt.value}
                            onClick={() => handleSingleSelectChange('target', opt.value)}
                            className={getButtonClasses(scenario.target === opt.value, index === 0)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </FormRow>
            
            <FormRow label="Impact" description="(select all that apply)">
                <div className="flex w-full rounded-md border border-border-color" role="group">
                    {SCENARIO_OPTIONS.impacts.map((opt, index) => {
                        const isActive = scenario.impacts[opt.value];
                        return (
                           <button
                                key={opt.value}
                                type="button"
                                role="checkbox"
                                aria-checked={isActive}
                                onClick={() => handleImpactChange(opt.value)}
                                className={getImpactButtonClasses(isActive, index === 0)}
                            >
                                {isActive && <CheckIcon />}
                                <span>{opt.label}</span>
                            </button>
                        )
                    })}
                </div>
            </FormRow>
        </div>
    );
};

export default ScenarioDefinition;