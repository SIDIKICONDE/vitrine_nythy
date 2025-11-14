'use client';

import { LucideIcon } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
  trend?: boolean; // true = up, false = down
  trendPercentage?: string;
  onClick?: () => void;
}

/**
 * Carte de statistique animée pour le dashboard admin
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
  trendPercentage,
  onClick,
}: StatCardProps): ReactElement {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        relative rounded-2xl p-6 transition-all duration-500 cursor-pointer
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        hover:scale-105 hover:shadow-2xl
      `}
      style={{ backgroundColor: color }}
      onClick={onClick}
    >
      {/* Contenu */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          {/* Icône */}
          <div className="p-2 bg-white rounded-xl">
            <Icon className="w-6 h-6" style={{ color }} />
          </div>

          {/* Trend badge */}
          {trend !== undefined && trendPercentage && (
            <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg">
              {trend ? (
                <svg className="w-4 h-4" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg className="w-4 h-4" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
              <span className="text-sm font-bold" style={{ color }}>
                {trendPercentage}
              </span>
            </div>
          )}
        </div>

        {/* Valeur */}
        <div className="text-4xl font-bold text-white mb-1">
          {value}
        </div>

        {/* Titre */}
        <div className="text-sm font-medium text-white/90 mb-1">
          {title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div className="text-xs text-white/70">
            {subtitle}
          </div>
        )}
      </div>

      {/* Effet de brillance */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

