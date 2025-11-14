'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { SolutionCard } from './SolutionCard';

interface Solution {
  title: string;
  description: string;
  tags: string[];
  image?: string;
  imageAlt?: string;
}

interface SolutionsSliderProps {
  solutions: Solution[];
}

export function SolutionsSlider({ solutions }: SolutionsSliderProps): ReactElement {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? solutions.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === solutions.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full">
      {/* Slider Container */}
      <div className="relative overflow-hidden">
        <div 
          className={`flex transition-transform duration-500 ease-in-out slider-container`}
          data-slide-index={currentIndex}
        >
          {solutions.map((solution, index) => (
            <div key={index} className="min-w-full px-4">
              <SolutionCard
                title={solution.title}
                description={solution.description}
                tags={solution.tags}
                image={solution.image}
                imageAlt={solution.imageAlt}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-all z-10 group"
        aria-label="Solution précédente"
      >
        <svg 
          className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-all z-10 group"
        aria-label="Solution suivante"
      >
        <svg 
          className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicators */}
      <div className="flex justify-center gap-2 mt-8">
        {solutions.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 rounded-full transition-all ${
              index === currentIndex 
                ? 'w-8 bg-primary' 
                : 'w-3 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Aller à la solution ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

