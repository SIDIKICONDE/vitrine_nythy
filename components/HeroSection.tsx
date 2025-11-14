'use client';

import { useState } from 'react';

interface HeroSectionProps {
  videoSrc?: string;
  title?: string;
  subtitle?: string;
}

export function HeroSection({
  videoSrc = '/video/hero-background.mp4',
  title = 'Chaque repas compte — luttons ensemble contre le gaspillage.',
  subtitle = ''
}: HeroSectionProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const handleVideoError = () => {
    setVideoError(true);
    setIsVideoLoaded(false);
    console.error('Erreur lors du chargement de la vidéo:', videoSrc);
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    setVideoError(false);
    console.log('Vidéo chargée avec succès:', videoSrc);
  };

  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Vidéo de fond */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoLoaded && !videoError ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Vidéo de fond illustrant la lutte contre le gaspillage alimentaire"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Image de fallback / placeholder */}
        <div 
          className={`absolute inset-0 bg-linear-to-br from-primary to-secondary transition-opacity duration-1000 ${
            isVideoLoaded && !videoError ? 'opacity-0' : 'opacity-100'
          }`}
        />
        
        {/* Overlay sombre pour améliorer la lisibilité */}
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/30 to-black/60" />
      </div>

      {/* Contenu en overlay */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        {/* Titre principal */}
        <h1 
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 text-white max-w-5xl animate-fade-in-up leading-tight"
        >
          {title}
        </h1>

        {/* Sous-titre */}
        {subtitle && (
          <h2 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white/95 mb-10 animate-fade-in-up animation-delay-200 tracking-wider hero-text-shadow"
          >
            {subtitle}
          </h2>
        )}

        {/* Call to Action - Deux boutons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 animate-fade-in-up animation-delay-400">
          <a
            href="#app"
            aria-label="Télécharger l'application Nythy"
            className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-primary hover:bg-primary-hover text-white font-semibold text-sm sm:text-base md:text-lg rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent"
          >
            TÉLÉCHARGEZ L'APPLICATION
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-y-1" aria-hidden="true">
              ↓
            </span>
          </a>
          
          <a
            href="#commerce"
            aria-label="Inscrire votre commerce sur Nythy"
            className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-secondary hover:bg-secondary-hover text-white font-semibold text-sm sm:text-base md:text-lg rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-transparent"
          >
            INSCRIVEZ VOTRE COMMERCE
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
              →
            </span>
          </a>
        </div>

        {/* Indicateur de scroll */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/70 rounded-full animate-scroll-indicator" />
          </div>
        </div>
      </div>

      {/* Effet de particules/lumière (optionnel) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow animation-delay-1000" />
      </div>
    </section>
  );
}

