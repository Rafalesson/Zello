import { Header } from '@/components/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { VitrineSection } from '@/components/landing/VitrineSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { PreFooterCTA } from '@/components/landing/PreFooterCTA';
import { Footer } from '@/components/Footer';

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <TrustSection />
        <VitrineSection />
        <FeaturesSection />
        <PreFooterCTA />
      </main>
      <Footer />
    </>
  );
}
