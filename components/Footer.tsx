import type { ReactElement } from 'react';
import { Container } from './layout/Container';

/**
 * Footer professionnel et minimaliste
 */
export function Footer(): ReactElement {
  const currentYear = new Date().getFullYear();

  const navigation = {
    solution: [
      { name: 'Marketplace Alimentaire', href: '#solution' },
      { name: 'Gestion Intelligente', href: '#solution' },
      { name: 'Réseau Solidaire', href: '#solution' },
      { name: 'Nythy PRO', href: '#nythy-pro' },
    ],
    company: [
      { name: 'Qui sommes-nous', href: '#qui-sommes-nous' },
      { name: 'Nos Valeurs', href: '#nos-valeurs' },
      { name: 'Notre Mission', href: '#mission' },
      { name: 'Impact', href: '#impact' },
      { name: 'Actualités', href: '#actualites' },
    ],
    support: [
      { name: 'Contact', href: '#contact' },
      { name: 'Devenir Partenaire', href: '#contact' },
      { name: 'FAQ', href: '#faq' },
      { name: 'Aide', href: '#aide' },
    ],
    legal: [
      { name: 'Mentions légales', href: '#mentions-legales' },
      { name: 'Politique de confidentialité', href: '#confidentialite' },
      { name: "Conditions d'utilisation", href: '#cgu' },
      { name: 'Gestion des cookies', href: '#cookies' },
    ],
  };

  const socials = [
    {
      name: 'Facebook',
      href: 'https://facebook.com',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
        </svg>
      ),
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="relative bg-[#010e0e] text-white border-t border-white/10 rounded-t-[36px] md:rounded-t-[56px] overflow-hidden shadow-custom-xl">
      {/* Section principale */}
      <Container padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-6">
          {/* Colonne Logo & Description */}
          <div className="lg:col-span-2">
            <a href="#accueil" className="inline-block mb-4">
              <h3 className="text-3xl md:text-4xl font-bold tracking-tighter text-white">
                NYTHY
              </h3>
              <p className="text-xs tracking-[0.3em] text-white/60 mt-1 uppercase">
                Ensemble contre le gaspillage
              </p>
            </a>
            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-sm">
              Une solution humaine et technologique qui unit commerçants et citoyens
              pour lutter contre le gaspillage alimentaire.
            </p>

            {/* Réseaux sociaux */}
            <div className="flex gap-4">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-primary transition-colors duration-300"
                  aria-label={`Suivez-nous sur ${social.name}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Colonne Solutions */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Solutions
            </h4>
            <ul className="space-y-2">
              {navigation.solution.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-white/70 hover:text-primary transition-colors duration-300"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne Entreprise */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Entreprise
            </h4>
            <ul className="space-y-2">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-white/70 hover:text-primary transition-colors duration-300"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne Support */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Support
            </h4>
            <ul className="space-y-2">
              {navigation.support.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-white/70 hover:text-primary transition-colors duration-300"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contact@nythy.com"
                  className="text-sm text-white/70 hover:text-primary transition-colors duration-300 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  contact@nythy.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+33612345678"
                  className="text-sm text-white/70 hover:text-primary transition-colors duration-300 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +33 6 12 34 56 78
                </a>
              </li>
              <li className="text-sm text-white/70 flex items-start gap-2 pt-1">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Strasbourg, France
              </li>
            </ul>
          </div>
        </div>
      </Container>

      {/* Barre de separation */}
      <div className="border-t border-white/10" />

      {/* Section Copyright & Légal */}
      <Container padding="sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          {/* Copyright */}
          <p className="text-white/60 text-center md:text-left">
            © {currentYear} NYTHY. Tous droits réservés. Fondé par Sidiki Condé.
          </p>

          {/* Liens légaux */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {navigation.legal.map((item, index) => (
              <span key={item.name} className="flex items-center gap-6">
                <a
                  href={item.href}
                  className="text-white/60 hover:text-primary transition-colors duration-300 whitespace-nowrap"
                >
                  {item.name}
                </a>
                {index < navigation.legal.length - 1 && (
                  <span className="text-white/20">•</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </Container>

      {/* Badge "Made with ❤️" */}
      <div className="border-t border-white/10">
        <Container padding="sm">
          <p className="text-center text-xs text-white/40">
            Créé avec{' '}
            <span className="text-red-400" aria-label="amour">❤️</span>
            {' '}à Strasbourg pour un monde sans gaspillage
          </p>
        </Container>
      </div>
    </footer>
  );
}

