import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { AboutSection } from '@/components/AboutSection';
import { SolutionsSection } from '@/components/SolutionsSection';
import { CommerceSection } from '@/components/CommerceSection';
import { ContactSection } from '@/components/ContactSection';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div className="bg-surface text-foreground font-sans">
      <Header />

      {/* Hero Section avec vidéo */}
      <HeroSection
        title="Chaque repas compte — luttons ensemble contre le gaspillage."
        subtitle=""
      />

      {/* Section Qui sommes-nous */}
      <AboutSection />

      {/* Section Nos Solutions */}
      <SolutionsSection />

      {/* Section Commerces */}
      <CommerceSection />

      {/* Section Contact */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
