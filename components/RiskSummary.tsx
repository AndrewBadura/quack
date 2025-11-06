

import React, { useState, useEffect } from 'react';
import InfoTooltip from './InfoTooltip';

interface RiskSummaryProps {
    inherentALE: number;
    residualALE: number;
    riskReduction: number;
    annualControlCost: number;
    costHighlightKey?: number;
}

const formatCurrency = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) {
        return '$0';
    }
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

const formatNumber = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) {
        return '0.0';
    }
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value);
};

const RiskSummary: React.FC<RiskSummaryProps> = ({ inherentALE, residualALE, riskReduction, annualControlCost, costHighlightKey }) => {
    const [isHighlighted, setIsHighlighted] = useState(false);

    useEffect(() => {
        // Don't trigger on initial mount (key is 0 or undefined)
        if (costHighlightKey) {
            setIsHighlighted(true);
            const timeout = setTimeout(() => {
                setIsHighlighted(false);
            }, 1500); // Duration of the highlight
            return () => clearTimeout(timeout);
        }
    }, [costHighlightKey]);

    const aleMethodologyText = (
        <>
            <strong className="font-semibold text-white">Annualized Loss Expectancy (ALE)</strong> is a core concept in risk management. It represents the total expected monetary loss for an asset over a one-year period.
        </>
    );
     const rosiMethodologyText = (
        <>
            <strong className="font-semibold text-white">Return on Security Investment (ROSI)</strong> measures the financial efficiency of your security controls.
            <br/><br/>
            It's calculated as: <br/>
            (Risk Reduction - Cost of Controls) / Cost of Controls
        </>
    );

    const reductionPercent = inherentALE > 0 ? (riskReduction / inherentALE) * 100 : 0;
    const rosi = annualControlCost > 0 ? ((riskReduction - annualControlCost) / annualControlCost) * 100 : 0;

    return (
        <div className="bg-surface rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-text-secondary tracking-wider mb-4 text-center">
                Financial Risk Summary
            </h3>
            <div className="space-y-4">
                <div className="text-center">
                    <p className="text-text-secondary text-sm">Inherent ALE (No Controls) <InfoTooltip text={aleMethodologyText} /></p>
                    <p className="text-text-primary font-bold text-2xl">{formatCurrency(inherentALE)}</p>
                </div>
                <div className="text-center">
                    <p className="text-text-secondary text-sm">Residual ALE (With Controls)</p>
                    <p className="text-primary font-bold text-2xl">{formatCurrency(residualALE)}</p>
                </div>
                 <div className="mt-4 text-center bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-green-700 text-sm">Annual Risk Reduction</p>
                    <p className="text-green-800 font-bold text-3xl">
                        -{formatCurrency(riskReduction)}
                    </p>
                    {isFinite(reductionPercent) && (
                      <p className="text-green-700 font-medium text-sm">({reductionPercent.toFixed(1)}% reduction)</p>
                    )}
                </div>
            </div>
            <div className="mt-4 border-t border-border-color pt-4 space-y-1 text-center">
                <div className={`p-2 rounded-lg transition-colors duration-1000 ease-out ${isHighlighted ? 'bg-yellow-100' : 'bg-transparent'}`}>
                    <p className="text-text-secondary text-sm">Annual Cost of Controls</p>
                    <p className="text-text-primary font-bold text-xl">{formatCurrency(annualControlCost)}</p>
                </div>
                
                {annualControlCost > 0 && riskReduction > 0 && (
                     <div className={`p-2 rounded-lg transition-colors duration-1000 ease-out ${isHighlighted ? 'bg-yellow-100' : 'bg-transparent'}`}>
                        <p className="text-text-secondary text-sm">Return on Security Investment (ROSI) <InfoTooltip text={rosiMethodologyText} /></p>
                        <p className={`font-bold text-2xl ${rosi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {`${formatNumber(rosi)}%`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiskSummary;