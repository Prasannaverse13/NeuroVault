import { DecentralizedArchitectureSection } from "./sections/DecentralizedArchitectureSection";
import { EngagementCTASection } from "./sections/EngagementCTASection";
import { EnterpriseUseCasesSection } from "./sections/EnterpriseUseCasesSection";
import { InfrastructureHighlightsSection } from "./sections/InfrastructureHighlightsSection";
import { PrimaryNavigationSection } from "./sections/PrimaryNavigationSection";
import { ProductFooterSection } from "./sections/ProductFooterSection";
import { ProductHeroSection } from "./sections/ProductHeroSection";

export const LandingPage = (): JSX.Element => {
  const sectionOrder = [
    { id: "hero", component: <ProductHeroSection /> },
    { id: "infrastructure", component: <InfrastructureHighlightsSection /> },
    { id: "use-cases", component: <EnterpriseUseCasesSection /> },
    { id: "architecture", component: <DecentralizedArchitectureSection /> },
    { id: "cta", component: <EngagementCTASection /> },
    { id: "footer", component: <ProductFooterSection /> },
  ];

  return (
    <main className="relative w-full overflow-x-hidden bg-[linear-gradient(0deg,rgba(11,15,26,1)_0%,rgba(11,15,26,1)_100%),linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_100%)] text-white">
      <PrimaryNavigationSection />
      <div className="flex w-full flex-col">
        {sectionOrder.map((section) => (
          <section key={section.id} className="relative w-full">
            {section.component}
          </section>
        ))}
      </div>
    </main>
  );
};
