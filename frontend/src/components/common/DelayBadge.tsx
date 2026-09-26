import React from 'react';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DelayBadgeProps {
  delaySeconds: number;
  formattedDelay?: string;
  showTargetStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const DelayBadge: React.FC<DelayBadgeProps> = ({
  delaySeconds,
  formattedDelay,
  showTargetStatus = true,
  size = 'md'
}) => {
  const isWithin = delaySeconds <= 300; // 5 minutes target

  // Fallback formatting if not provided
  const displayDelay =
    formattedDelay ||
    (() => {
      const h = Math.floor(delaySeconds / 3600);
      const m = Math.floor((delaySeconds % 3600) / 60);
      const s = delaySeconds % 60;
      if (h > 0) return `${h}h ${m < 10 ? '0' : ''}${m}m ${s < 10 ? '0' : ''}${s}s`;
      if (m > 0) return `${m}m ${s < 10 ? '0' : ''}${s}s`;
      return `${s}s`;
    })();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5'
  }[size];

  return (
    <div className="inline-flex items-center space-x-1.5 font-mono">
      <span
        className={`inline-flex items-center rounded-md font-semibold border ${sizeClasses} ${
          isWithin
            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80 shadow-sm shadow-emerald-950'
            : 'bg-amber-950/60 text-amber-400 border-amber-800/80 shadow-sm shadow-amber-950'
        }`}
      >
        <Clock className="w-3.5 h-3.5 mr-1 opacity-75" />
        {displayDelay}
      </span>

      {showTargetStatus && (
        <span
          className={`inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
            isWithin
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
          title={isWithin ? 'Detection achieved within 5-minute target' : 'Detection exceeded 5-minute target'}
        >
          {isWithin ? (
            <>
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
              ≤ 5m Target
            </>
          ) : (
            <>
              <AlertTriangle className="w-3 h-3 mr-1 text-amber-400" />
              &gt; 5m Delay
            </>
          )}
        </span>
      )}
    </div>
  );
};
