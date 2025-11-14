'use client';

import Link from 'next/link';
import { useRef, useState, type FocusEvent } from 'react';
import { MegaMenu } from './MegaMenu';

interface NavigationProps {
  isScrolled: boolean;
}

/**
 * Navigation principale du Header
 */
export function Navigation({ isScrolled }: NavigationProps) {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMegaMenu = () => {
    clearCloseTimeout();
    setIsMegaMenuOpen(true);
  };

  const closeMegaMenuDelayed = (delay = 300) => {
    clearCloseTimeout();
    closeTimerRef.current = window.setTimeout(() => setIsMegaMenuOpen(false), delay);
  };

  const toggleMegaMenu = () => {
    if (typeof window !== 'undefined') {
      const prefersHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (prefersHover) {
        openMegaMenu();
        return;
      }
    }
    setIsMegaMenuOpen(!isMegaMenuOpen);
  };

  const handleBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (!nextTarget || !(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      closeMegaMenuDelayed();
    }
  };

  const navLinkClass = `rounded-full border px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-all duration-200 uppercase tracking-wide whitespace-nowrap ${isScrolled
    ? 'border-white/15 text-white/90 hover:text-white hover:bg-white/10 hover:border-white/35'
    : 'border-border/60 text-foreground/90 hover:text-primary hover:bg-surface-muted hover:border-border-hover'
    }`;

  const mobileNavLinkClass = `block px-4 py-3 text-sm font-medium uppercase tracking-wide transition-all duration-200 ${isScrolled
    ? 'text-white/90 hover:text-white hover:bg-white/10'
    : 'text-foreground/90 hover:text-primary hover:bg-surface-muted'
    }`;

  const separatorClass = isScrolled ? 'text-white/30' : 'text-border';

  return (
    <nav className={`transition-all duration-300 ${isScrolled ? 'border-t-0' : 'border-t border-border'}`}>
      {/* Bouton Hamburger (Mobile uniquement) */}
      <div className="lg:hidden flex items-center justify-between py-3 px-4">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`p-2 rounded-lg transition-colors ${isScrolled
            ? 'text-white hover:bg-white/10'
            : 'text-foreground hover:bg-surface-muted'
            }`}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Menu Desktop */}
      <div className="hidden lg:flex items-center justify-center gap-1 md:gap-2 py-2 md:py-3">
        <a href="#accueil" className={navLinkClass}>Accueil</a>
        <span className={separatorClass}>|</span>

        <a href="#solution" className={navLinkClass}>Solution</a>
        <span className={separatorClass}>|</span>

        <a href="#qui-sommes-nous" className={navLinkClass}>Qui sommes nous</a>
        <span className={separatorClass}>|</span>

        <a href="#commerces" className={navLinkClass}>Commerces</a>
        <span className={separatorClass}>|</span>

        {/* Méga Menu Actualités */}
        <div
          ref={megaMenuRef}
          className="relative"
          onMouseEnter={openMegaMenu}
          onMouseLeave={() => closeMegaMenuDelayed()}
          onFocusCapture={openMegaMenu}
          onBlurCapture={handleBlurCapture}
        >
          <button
            type="button"
            onClick={toggleMegaMenu}
            className={`flex items-center gap-1.5 ${navLinkClass} ${isMegaMenuOpen
              ? isScrolled
                ? 'bg-white/10 text-white border-white/35'
                : 'bg-surface-muted text-primary border-border-hover'
              : ''
              }`}
            aria-expanded={isMegaMenuOpen}
            aria-haspopup="true"
            aria-controls="actualites-mega-menu"
          >
            <span>Actualités</span>
            <svg
              className={`h-3 w-3 transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180' : 'rotate-0'
                } ${isScrolled ? 'text-white' : 'text-foreground-muted'}`}
              viewBox="0 0 12 12"
              aria-hidden="true"
            >
              <path
                d="M2.47 4.97a.75.75 0 0 1 1.06 0L6 7.44l2.47-2.47a.75.75 0 0 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 0-1.06z"
                fill="currentColor"
              />
            </svg>
          </button>

          <MegaMenu
            isOpen={isMegaMenuOpen}
            onMouseEnter={openMegaMenu}
            onMouseLeave={() => closeMegaMenuDelayed()}
          />
        </div>

        <span className={separatorClass}>|</span>
        <a href="#nos-valeurs" className={navLinkClass}>Nos Valeurs</a>

        <Link
          href="/merchant/login"
          className={`relative rounded-full border px-4 md:px-5 py-1.5 text-xs md:text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-300 ml-2 ${isScrolled
            ? 'border-white bg-white text-primary hover:bg-white/90 hover:border-white/80 shadow-lg'
            : 'border-primary/70 bg-primary text-white hover:bg-primary-dark hover:border-primary hover:shadow-lg hover:scale-105 shadow-md'
            }`}
        >
          <span className="flex items-center gap-1.5">
            Nythy PRO
            <span className="text-[10px] font-extrabold">✦</span>
          </span>
        </Link>
      </div>

      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-inherit mx-4 mb-4 mt-2 rounded-2xl shadow-lg overflow-hidden">
          <div className="py-2">
            <a href="#accueil" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
              Accueil
            </a>
            <a href="#solution" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
              Solution
            </a>
            <a href="#qui-sommes-nous" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
              Qui sommes nous
            </a>
            <a href="#commerces" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
              Commerces
            </a>
            <a href="#actualites" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
              Actualités
            </a>
            <a href="#nos-valeurs" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
              Nos Valeurs
            </a>
            <Link
              href="/merchant/login"
              className={`block mx-4 my-3 text-center rounded-full border px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-all duration-300 ${isScrolled
                ? 'border-white bg-white text-primary'
                : 'border-primary bg-primary text-white'
                }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Nythy PRO ✦
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

