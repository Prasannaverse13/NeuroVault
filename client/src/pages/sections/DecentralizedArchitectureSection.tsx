import { Card, CardContent } from "@/components/ui/card";

const architectureNodes = [
  {
    title: "Autonomous Agents",
    imageSrc: "/figmaAssets/margin-3.svg",
    imageClassName: "w-[120px] h-[120px] -mt-5",
  },
  {
    title: "NeuroVault Core",
    imageSrc: "/figmaAssets/margin.svg",
    imageClassName: "w-24 h-28",
  },
  {
    title: "Memory Cluster",
    imageSrc: "/figmaAssets/margin-2.svg",
    imageClassName: "w-20 h-24",
  },
] as const;

export const DecentralizedArchitectureSection = (): JSX.Element => {
  return (
    <section className="relative w-full px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto flex w-full max-w-screen-lg flex-col items-center gap-6">
        <header className="flex w-full flex-col items-center">
          <h2 className="mt-[-1.00px] text-center [font-family:'Inter',Helvetica] text-base font-normal leading-6 tracking-[0] text-white">
            Decentralized Intelligence Architecture
          </h2>
        </header>
        <div className="flex w-full max-w-2xl flex-col items-center px-0 pb-10 pt-0">
          <p className="mt-[-1.00px] text-center [font-family:'Inter',Helvetica] text-base font-normal leading-6 tracking-[0] text-slate-400">
            A unified framework connecting sovereign agents to high-performance
            memory clusters
            <br />
            across the decentralized web.
          </p>
        </div>
        <Card className="w-full overflow-hidden rounded-3xl border border-solid border-[#ffffff14] bg-[#ffffff08] shadow-none backdrop-blur-[10px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(10px)_brightness(100%)]">
          <CardContent className="p-6 sm:p-8 lg:p-12">
            <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
              <div className="inline-flex flex-col items-center">
                <img
                  className={architectureNodes[0].imageClassName}
                  alt={architectureNodes[0].title}
                  src={architectureNodes[0].imageSrc}
                />
                <p className="text-center [font-family:'Inter',Helvetica] text-base font-normal leading-6 tracking-[0] text-white whitespace-nowrap">
                  {architectureNodes[0].title}
                </p>
              </div>
              <div className="relative hidden h-px min-w-[80px] flex-1 bg-[linear-gradient(90deg,rgba(139,92,246,0.5)_0%,rgba(6,182,212,0.5)_50%,rgba(139,92,246,0.5)_100%)] lg:block">
                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded border border-solid border-[#ffffff14] bg-[#ffffff08] px-4 py-1 backdrop-blur-[10px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(10px)_brightness(100%)]">
                  <span className="text-center [font-family:'Inter',Helvetica] text-[10px] font-normal leading-[15px] tracking-[-0.50px] text-[#e1e3e4]">
                    SECURE
                    <br />
                    PROTOCOL
                  </span>
                </div>
              </div>
              <div className="inline-flex flex-col items-center">
                <img
                  className={architectureNodes[1].imageClassName}
                  alt={architectureNodes[1].title}
                  src={architectureNodes[1].imageSrc}
                />
                <p className="text-center [font-family:'Inter',Helvetica] text-base font-normal leading-6 tracking-[0] text-white whitespace-nowrap">
                  {architectureNodes[1].title}
                </p>
              </div>
              <div className="hidden h-px min-w-[80px] flex-1 bg-[linear-gradient(90deg,rgba(139,92,246,0.5)_0%,rgba(6,182,212,0.5)_50%,rgba(139,92,246,0.5)_100%)] lg:block" />
              <div className="inline-flex flex-col items-center">
                <img
                  className={architectureNodes[2].imageClassName}
                  alt={architectureNodes[2].title}
                  src={architectureNodes[2].imageSrc}
                />
                <p className="text-center [font-family:'Inter',Helvetica] text-base font-normal leading-6 tracking-[0] text-white whitespace-nowrap">
                  {architectureNodes[2].title}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
