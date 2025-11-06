

import React, { useState, useRef, useLayoutEffect } from 'react';
import { SimulationResult } from '../types';

interface LossExceedanceCurveProps {
  inherentResults: SimulationResult | null;
  residualResults: SimulationResult | null;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
    if (isNaN(value) || value < 1) return '$0';
    if (value < 1000) return `$${value.toFixed(0)}`;
    if (value < 1e6) return `$${(value / 1e3).toFixed(1)}K`;
    if (value < 1e9) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${(value / 1e9).toFixed(1)}B`;
};

const LossExceedanceCurve: React.FC<LossExceedanceCurveProps> = ({ inherentResults, residualResults, isLoading = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    hoveredLoss: number;
    inherent: { loss: number; prob: number } | null;
    residual: { loss: number; prob: number } | null;
  } | null>(null);

  useLayoutEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, [inherentResults]);

  const positiveInherentLosses = inherentResults ? inherentResults.filter(loss => loss > 0) : [];

  if (!inherentResults || inherentResults.length === 0 || positiveInherentLosses.length === 0) {
    let message = "Adjust the financial inputs to generate the Loss Exceedance Curve.";
    if (inherentResults && inherentResults.length > 0 && positiveInherentLosses.length === 0) {
        message = "The simulation resulted in no financial loss events across all iterations.";
    } else if (inherentResults) {
        message = "Invalid inputs for simulation. Please provide a non-zero Min and Max Loss.";
    }
    return (
       <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-background rounded-lg">
           <div className="text-center p-4">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-text-secondary mt-2">Generating simulation...</p>
                </>
              ) : (
                <p className="text-text-secondary">{message}</p>
              )}
           </div>
       </div>
    );
  }

  const margin = { top: 20, right: 20, bottom: 50, left: 60 };
  const width = size.width - margin.left - margin.right;
  const height = size.height - margin.top - margin.bottom;

  if (width <= 0 || height <= 0) {
    return <div ref={containerRef} className="w-full h-full"></div>;
  }

  const calculateYMaxDomain = (prob: number): number => {
    if (prob <= 0) return 100;
    if (prob >= 100) return 100;
    const niceSteps = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    return niceSteps.find(step => step >= prob) || 100;
  };

  const maxProb = (positiveInherentLosses.length / inherentResults.length) * 100;
  const yMaxDomain = calculateYMaxDomain(maxProb);

  const inherentData = inherentResults.map((loss, index) => ({
    loss,
    prob: ((index + 1) / inherentResults.length) * 100,
  }));
  const inherentPlotData = inherentData.filter(d => d.loss > 0);
  
  const residualPlotData = residualResults 
    ? residualResults
        .map((loss, index) => ({
          loss,
          prob: ((index + 1) / residualResults.length) * 100,
        }))
        .filter(d => d.loss > 0)
    : [];

  const allPlotData = [...inherentPlotData, ...residualPlotData];
  const maxDataValue = Math.max(1, Math.max(...allPlotData.map(d => d.loss)));
  const minDataValue = Math.min(...allPlotData.map(d => d.loss));
  
  let minDomain = minDataValue;
  let maxDomain = maxDataValue;

  if (minDomain >= maxDomain) {
      minDomain = maxDomain * 0.9;
      maxDomain = maxDomain * 1.1;
  }
  minDomain = Math.max(1, minDomain);
  
  const logScale = (x: number) => Math.log10(x);
  const minLogLoss = logScale(minDomain);
  const maxLogLoss = logScale(maxDomain);

  const xScale = (x: number) => {
      if (maxLogLoss === minLogLoss) return 0;
      const clampedX = Math.max(minDomain, Math.min(x, maxDomain));
      return ((logScale(clampedX) - minLogLoss) / (maxLogLoss - minLogLoss)) * width;
  };
  const yScale = (y: number) => {
      if (yMaxDomain === 0) return height;
      return height - (y / yMaxDomain) * height;
  };

  const inherentPathData = inherentPlotData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.loss)} ${yScale(d.prob)}`)
    .join(' ');
    
  const residualPathData = residualPlotData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.loss)} ${yScale(d.prob)}`)
    .join(' ');

  const xTicks = [];
  const minPower = Math.floor(Math.log10(minDomain));
  const maxPower = Math.ceil(Math.log10(maxDomain));

  for (let p = minPower; p < maxPower; p++) {
      const powerOf10 = Math.pow(10, p);
      for (const m of [1, 2, 5]) {
          const tick = m * powerOf10;
          if (tick >= minDomain && tick <= maxDomain) {
              if (!xTicks.includes(tick)) xTicks.push(tick);
          }
      }
  }
  const topTick = Math.pow(10, maxPower);
  if(topTick >= minDomain && topTick <= maxDomain && !xTicks.includes(topTick)) xTicks.push(topTick);
  
  if (xTicks.length === 0 || (xTicks.length === 1 && xTicks[0] !== minDomain)) {
      if (!xTicks.includes(minDomain)) xTicks.unshift(minDomain);
  }
  if (!xTicks.includes(maxDomain)) xTicks.push(maxDomain);

  const uniqueTicks = [...new Set(xTicks.map(t => t.toPrecision(6)))].map(s => parseFloat(s)).sort((a, b) => a-b);
    
  const numYTicks = 5;
  const yTicks = Array.from({ length: numYTicks + 1 }, (_, i) => (i / numYTicks) * yMaxDomain);
  const yTickFormatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
  });
  
  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        setTooltip(null);
        return;
    }

    const logLossAtX = (minLogLoss * (width - mouseX) + maxLogLoss * mouseX) / width;
    const hoveredLoss = Math.pow(10, logLossAtX);

    const findPointForLoss = (data: {loss: number, prob: number}[], targetLoss: number) => {
        if (!data || data.length === 0) return null;
        const point = data.find(p => p.loss <= targetLoss);
        return point || data[data.length - 1];
    };

    const inherentPoint = findPointForLoss(inherentPlotData, hoveredLoss);
    const residualPoint = findPointForLoss(residualPlotData, hoveredLoss);

    if (inherentPoint || residualPoint) {
        setTooltip({
            x: mouseX + margin.left,
            y: mouseY + margin.top,
            hoveredLoss,
            inherent: inherentPoint,
            residual: residualPoint,
        });
    } else {
        setTooltip(null);
    }
  };
  
  const handleMouseLeave = () => {
      setTooltip(null);
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
       {isLoading && (
        <div className="absolute inset-0 bg-surface/75 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
            <div className="flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-text-secondary mt-2">Updating simulation...</p>
            </div>
        </div>
      )}
      <svg width={size.width} height={size.height} style={{ overflow: 'visible' }} className={`transition-opacity duration-300 ${isLoading ? 'opacity-30' : 'opacity-100'}`}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Axes and Grid Lines */}
          <line x1="0" y1={height} x2={width} y2={height} stroke="#e2e8f0" />
          <line x1="0" y1="0" x2="0" y2={height} stroke="#e2e8f0" />

          {/* Y Grid Lines & Labels */}
          {yTicks.map(tick => (
            <g key={`y-grid-${tick}`} className="text-xs text-text-secondary fill-current">
                <line x1="0" y1={yScale(tick)} x2={width} y2={yScale(tick)} stroke="#f1f5f9" />
                <text x="-10" y={yScale(tick)} dy="0.32em" textAnchor="end">{yTickFormatter.format(tick)}%</text>
            </g>
          ))}
          {/* X Grid Lines & Labels */}
          {uniqueTicks.map(tick => (
             <g key={`x-grid-${tick}`} className="text-xs text-text-secondary fill-current">
                <line x1={xScale(tick)} y1="0" x2={xScale(tick)} y2={height} stroke="#f1f5f9" />
                <text x={xScale(tick)} y={height + 20} textAnchor="middle">{formatCurrency(tick)}</text>
             </g>
          ))}
          
           {/* Axis Labels */}
          <text transform={`translate(${width / 2}, ${height + 45})`} textAnchor="middle" className="text-sm fill-text-primary font-medium">Annual Loss ($)</text>
          <text transform={`rotate(-90)`} x={-height/2} y={-50} textAnchor="middle" className="text-sm fill-text-primary font-medium">Probability of Exceedance</text>

          {/* Data Paths */}
          <path d={inherentPathData} fill="none" strokeWidth="2" className="stroke-primary" />
          <path d={residualPathData} fill="none" strokeWidth="2" strokeDasharray="6 4" className="stroke-green-500" />
          
          {/* Legend */}
          <g transform={`translate(${width - 200}, -10)`} className="text-xs">
            <rect x="0" y="0" width="12" height="3" className="fill-primary" />
            <text x="18" y="5" className="fill-text-primary font-medium">Inherent Risk</text>
            <path d="M 110 1.5 L 122 1.5" strokeDasharray="3 2" className="stroke-green-500" strokeWidth="2"/>
            <text x="128" y="5" className="fill-text-primary font-medium">Residual Risk</text>
          </g>
          
          {/* Interactive Hover Elements */}
          {tooltip && (
              <g className="pointer-events-none">
                  {/* Vertical Line at cursor */}
                  <line x1={xScale(tooltip.hoveredLoss)} y1="0" x2={xScale(tooltip.hoveredLoss)} y2={height} className="stroke-slate-400 stroke-dasharray-4 4" />

                  {/* Inherent Point */}
                  {tooltip.inherent && (
                      <>
                        <line x1={xScale(tooltip.inherent.loss)} y1={yScale(tooltip.inherent.prob)} x2={0} y2={yScale(tooltip.inherent.prob)} strokeDasharray="4 4" className="stroke-slate-400" />
                        <circle cx={xScale(tooltip.inherent.loss)} cy={yScale(tooltip.inherent.prob)} r="5" className="fill-primary stroke-white" strokeWidth="2" />
                      </>
                  )}
                  {/* Residual Point */}
                  {tooltip.residual && (
                      <>
                        <line x1={xScale(tooltip.residual.loss)} y1={yScale(tooltip.residual.prob)} x2={0} y2={yScale(tooltip.residual.prob)} strokeDasharray="4 4" className="stroke-slate-400" />
                        <circle cx={xScale(tooltip.residual.loss)} cy={yScale(tooltip.residual.prob)} r="5" className="fill-green-500 stroke-white" strokeWidth="2" />
                      </>
                  )}
              </g>
          )}

          {/* Invisible rectangle for mouse events */}
          <rect onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} width={width} height={height} className="opacity-0 cursor-crosshair"/>
        </g>
      </svg>
      {tooltip && (
          <div className="absolute p-3 text-sm bg-slate-800 text-white rounded-md shadow-lg pointer-events-none w-48"
             style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: `translate(${tooltip.x > size.width / 2 ? '-115%' : '25px'}, -50%)`
            }}
          >
              <div className="mb-2 border-b border-slate-600 pb-2">
                  <p className="text-slate-300 text-xs">Prob. of loss exceeding</p>
                  <p className="font-bold text-base">{formatCurrency(tooltip.hoveredLoss)}</p>
              </div>

              {tooltip.inherent && (
                  <div className="flex justify-between items-center mb-1">
                      <span className='capitalize text-blue-300'>Inherent</span>
                      <span className="font-bold">{tooltip.inherent.prob.toFixed(2)}%</span>
                  </div>
              )}
               {tooltip.residual && (
                  <div className="flex justify-between items-center">
                      <span className='capitalize text-green-300'>Residual</span>
                      <span className="font-bold">{tooltip.residual.prob.toFixed(2)}%</span>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default LossExceedanceCurve;