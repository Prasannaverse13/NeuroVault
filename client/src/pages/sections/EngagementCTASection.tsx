import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

const ctaButtons = [
  { label: "Start Building Now", variant: "primary" as const, href: "/auth" },
  { label: "Talk to Sales", variant: "secondary" as const, href: "/marketplace" },
];

export const EngagementCTASection = (): JSX.Element => {
  return (
    <section className="relative w-full px-6">
      <Card className="relative w-full overflow-hidden rounded-[32px] border border-solid border-[#ffffff1a] bg-[linear-gradient(176deg,rgba(76,29,149,0.2)_0%,rgba(11,15,26,1)_50%,rgba(22,78,99,0.2)_100%)] shadow-none">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(139,92,246,0)_0%,rgba(139,92,246,0.5)_50%,rgba(139,92,246,0)_100%)]" />
        <CardContent className="flex flex-col items-center gap-6 px-6 py-12 sm:px-10 sm:py-14 md:px-16 md:py-16">
          <header className="flex w-full flex-col items-center">
            <h2 className="text-center [font-family:'Inter',Helvetica] text-base font-normal leading-6 tracking-[0] text-white">
              Build the future of memory.
            </h2>
          </header>
          <div className="flex w-full max-w-2xl flex-col items-center">
            <p className="text-center [font-family:'Inter',Helvetica] text-base font-normal leading-6 tracking-[0] text-slate-400">
              Join the 4,000+ organizations building state-of-the-art AI
              infrastructures with
              <br />
              NeuroVault.
            </p>
          </div>
          <div className="flex w-full flex-col items-center justify-center gap-4 pt-4 sm:flex-row sm:items-start">
            {ctaButtons.map((button) => (
              <Link
                key={button.label}
                href={button.href}
                data-testid={`button-cta-${button.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={
                  button.variant === "primary"
                    ? "inline-flex h-auto items-center justify-center rounded-xl bg-white px-10 py-4 [font-family:'Inter',Helvetica] text-base font-normal leading-[25.6px] tracking-[0.16px] text-[#0b0f1a] transition-colors hover:bg-white/90"
                    : "inline-flex h-auto items-center justify-center rounded-xl border border-solid border-[#ffffff14] bg-[#ffffff08] px-10 py-4 [font-family:'Inter',Helvetica] text-base font-normal leading-[25.6px] tracking-[0.16px] text-white backdrop-blur-[10px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(10px)_brightness(100%)] transition-colors hover:bg-[#ffffff10]"
                }
              >
                {button.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
