import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const heroContent = {
  badge: "V2.0 ENTERPRISE RELEASE",
  description: [
    "Enterprise AI memory infrastructure powered by decentralized intelligence. Seamlessly",
    "bridge high-performance computation with persistent cognitive storage.",
  ],
  actions: [
    { label: "Get Started", variant: "primary" as const, href: "/auth" },
    { label: "View Demo", variant: "secondary" as const, href: "/dashboard" },
  ],
};

export const ProductHeroSection = (): JSX.Element => {
  return (
    <section className="relative w-full overflow-hidden px-6 pb-4 pt-16">
      <div className="absolute left-1/2 top-1/2 z-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-[42%] rounded-full bg-[#7c3aed1a] blur-[60px]" />
      <div className="relative z-[2] mx-auto flex w-full max-w-6xl flex-col items-center">
        <header className="flex w-full max-w-4xl flex-col items-center gap-2 text-center">
          <Badge className="h-auto rounded-full border border-[#ffffff1a] bg-[#ffffff0d] px-3 py-1 text-violet-400 backdrop-blur-[6px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(6px)_brightness(100%)] hover:bg-[#ffffff0d]">
            <span className="[font-family:'Inter',Helvetica] text-[10px] font-normal tracking-[1px] leading-[15px] text-violet-400">
              {heroContent.badge}
            </span>
          </Badge>
          <div className="flex w-full flex-col items-center px-0 pb-0 pt-8">
            <img
              className="h-[35.84px] w-[151.64px]"
              alt="AI That Remembers Learns Evolves"
              src="/figmaAssets/text.svg"
            />
          </div>
          <div className="flex w-full max-w-2xl flex-col items-center">
            <p className="[font-family:'Inter',Helvetica] text-base font-normal leading-6 text-slate-400">
              {heroContent.description[0]}
              <br />
              {heroContent.description[1]}
            </p>
          </div>
          <nav
            aria-label="Hero actions"
            className="flex w-full flex-wrap items-center justify-center gap-4"
          >
            {heroContent.actions.map((action) => {
              const isPrimary = action.variant === "primary";
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  data-testid={`button-hero-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={
                    isPrimary
                      ? "inline-flex h-auto items-center justify-center rounded-xl px-8 py-4 [font-family:'Inter',Helvetica] text-base font-normal tracking-[0.16px] leading-[25.6px] text-white shadow-[0px_0px_20px_#8b5cf64c] bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] transition-opacity hover:opacity-95"
                      : "inline-flex h-auto items-center justify-center rounded-xl border border-[#ffffff1a] bg-[#ffffff0d] px-8 py-4 [font-family:'Inter',Helvetica] text-base font-normal tracking-[0.16px] leading-[25.6px] text-white backdrop-blur-md backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(12px)_brightness(100%)] transition-colors hover:bg-[#ffffff14]"
                  }
                >
                  {action.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <div className="relative z-[1] w-full max-w-screen-lg pt-20">
          <Card className="w-full overflow-hidden rounded-2xl border border-[#ffffff14] bg-[#ffffff08] shadow-[0px_25px_50px_-12px_#00000040] backdrop-blur-[10px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(10px)_brightness(100%)]">
            <CardContent className="relative p-0">
              <div
                className="h-[574px] w-full opacity-60 bg-cover bg-[50%_50%] bg-no-repeat"
                style={{
                  backgroundImage:
                    "url(/figmaAssets/ab6axuabwfkxtlulpbnp5v8kud5b6k39ky1bppqqeobfrqs8ryjkfh2hl84cfrqu.png)",
                }}
              />
              <div className="pointer-events-none absolute inset-px bg-[linear-gradient(0deg,rgba(11,15,26,1)_0%,rgba(11,15,26,0)_50%,rgba(11,15,26,0)_100%)]" />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
