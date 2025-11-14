import type { ReactElement } from 'react';
import Image from 'next/image';

/**
 * Carte de solution pour la section "Nos Solutions"
 */
interface SolutionCardProps {
  title: string;
  description: string;
  tags: string[];
  image?: string;
  imageAlt?: string;
  className?: string;
}

export function SolutionCard({ 
  title, 
  description, 
  tags, 
  image, 
  imageAlt,
  className = '' 
}: SolutionCardProps): ReactElement {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col ${className}`}
    >
      {/* Image si présente */}
      {image && (
        <div className="relative w-full h-64 bg-gray-100">
          <Image
            src={image}
            alt={imageAlt || title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      )}
      
      {/* Contenu de la carte */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-primary mb-3 uppercase tracking-wide">
          {title}
        </h3>
        <p className="text-gray-600 mb-6 flex-1 leading-relaxed">
          {description}
        </p>
        
        {/* Tags en bas */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="text-sm text-primary hover:text-primary-dark transition-colors cursor-pointer font-medium"
            >
              {tag}
              {index < tags.length - 1 && index < tags.length - 1 && ','}
            </span>
          ))}
          <span className="text-primary ml-auto">→</span>
        </div>
      </div>
    </div>
  );
}

