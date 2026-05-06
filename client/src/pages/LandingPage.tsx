import { DecentralizedArchitectureSection } from "./sections/DecentralizedArchitectureSection";
import { EngagementCTASection } from "./sections/EngagementCTASection";
import { EnterpriseUseCasesSection } from "./sections/EnterpriseUseCasesSection";
import { InfrastructureHighlightsSection } from "./sections/InfrastructureHighlightsSection";
import { PrimaryNavigationSection } from "./sections/PrimaryNavigationSection";
import { ProductFooterSection } from "./sections/ProductFooterSection";
import { ProductHeroSection } from "./sections/ProductHeroSection";

export const LandingPage = (): JSX.Element => {
  return (
    <main className="relative w-full overflow-x-hidden bg-[linear-gradient(0deg,rgba(11,15,26,1)_0%,rgba(11,15,26,1)_100%),linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_100%)] text-white">
      <PrimaryNavigationSection />
      <div className="flex w-full flex-col">
        <section id="hero" className="relative w-full">
          <ProductHeroSection />
        </section>
        <section id="infrastructure" className="relative w-full">
          <InfrastructureHighlightsSection />
        </section>
        <section id="use-cases" className="relative w-full">
          <EnterpriseUseCasesSection />
        </section>
        <section id="architecture" className="relative w-full">
          <DecentralizedArchitectureSection />
        </section>
        <section id="cta" className="relative w-full">
          <EngagementCTASection />
        </section>
        <section id="footer" className="relative w-full">
          <ProductFooterSection />
        </section>
      </div>
    </main>
  );
};
