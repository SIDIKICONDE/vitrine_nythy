/**
 * Logo central du Header
 */
export function Logo({ isScrolled }: { isScrolled: boolean }) {
  return (
    <div className={`flex items-center justify-center transition-all duration-300 overflow-hidden ${
      isScrolled ? 'max-h-0 opacity-0 py-0' : 'max-h-32 opacity-100 py-3 md:py-4'
    }`}>
      <a href="/" className="group text-center">
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter logo-nythy transition-all duration-300 group-hover:opacity-80 text-center">
          NYTHY
        </div>
        <p className="text-center text-xs tracking-[0.3em] text-foreground-muted mt-1 uppercase">
          Ensemble contre le gaspillage
        </p>
      </a>
    </div>
  );
}

