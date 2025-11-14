'use client';

import { useEffect, useState } from 'react';
import { Logo } from './header/Logo';
import { Navigation } from './header/Navigation';
import { TopBar } from './header/TopBar';

/**
 * Header principal - Refactorisé en composants modulaires
 * - TopBar: Barre supérieure avec infos secondaires
 * - Logo: Logo central imposant
 * - Navigation: Navigation principale avec méga menu
 */
export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-primary shadow-custom-lg' : 'bg-surface'
        }`}
    >
      <TopBar isScrolled={isScrolled} />

      <div className={`transition-all duration-300 ${isScrolled ? 'border-b border-white/20' : 'border-b border-border'
        }`}>
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 relative">
          <Logo isScrolled={isScrolled} />
          <Navigation isScrolled={isScrolled} />
        </div>
      </div>

      {/* Ligne d'accent */}
      <div className={`h-0.5 bg-linear-to-r from-transparent via-primary to-transparent transition-all duration-300 ${isScrolled ? 'opacity-0' : 'opacity-100'
        }`} />
    </header>
  );
}
