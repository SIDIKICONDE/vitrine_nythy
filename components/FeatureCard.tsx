import type { Feature } from '@/types';
import type { ReactElement } from 'react';

/**
 * Carte de fonctionnalité typée fortement
 */
interface FeatureCardProps {
  feature: Feature;
  className?: string;
}

export function FeatureCard({ feature, className = '' }: FeatureCardProps): ReactElement {
  return (
    <div
      className={`bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all ${className}`}
    >
      <div className="text-4xl mb-4">{feature.icon}</div>
      <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
      <p className="text-gray-300">{feature.description}</p>
    </div>
  );
}

