import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const useCases = [
  {
    title: "DevOps AI",
    description: (
      <>
        Automated infrastructure management with deep
        <br />
        architectural memory.
      </>
    ),
    imageClass:
      "bg-[url(/figmaAssets/ab6axucwghnusayia69qqdfoiszpshy2miqu9v--nboipcyh0drahlvabpzmqkpa.png)]",
    tag: "AUTOMATION",
    tagWrapperClass: "bg-[#8b5cf633]",
    tagTextClass: "text-violet-300",
  },
  {
    title: "Support AI",
    description: (
      <>
        Agentic support that remembers every historical
        <br />
        interaction and preference.
      </>
    ),
    imageClass:
      "bg-[url(/figmaAssets/ab6axub9rqll9youmkcpxkv6osqowci1axdjxy-odfb6y-icugh4k8m2uibbp5ep.png)]",
    tag: "CUSTOMER EXPERIENCE",
    tagWrapperClass: "bg-[#06b6d433]",
    tagTextClass: "text-cyan-300",
  },
  {
    title: "Knowledge AI",
    description: (
      <>
        Turning fragmented documentation into an unified,
        <br />
        actionable intelligence core.
      </>
    ),
    imageClass:
      "bg-[url(/figmaAssets/ab6axudtwfsc0gy-ynijzaxj15rozvq-r73docb81uho-dfkuad0gtw-pu--xelr.png)]",
    tag: "KNOWLEDGE BASE",
    tagWrapperClass: "bg-[#ffffff1a]",
    tagTextClass: "text-white",
  },
];

export const EnterpriseUseCasesSection = (): JSX.Element => {
  return (
    <section className="relative w-full bg-[#0c0f1080] py-20">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-16 px-6">
        <header className="flex w-full flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-xl flex-col gap-4">
            <div className="flex flex-col">
              <p className="mt-[-1.00px] [font-family:'Inter',Helvetica] text-base font-normal leading-6 tracking-[0] text-white">
                Enterprise Verticals
              </p>
            </div>
            <div className="flex flex-col">
              <p className="mt-[-1.00px] [font-family:'Inter',Helvetica] text-base font-normal leading-6 tracking-[0] text-slate-400">
                NeuroVault provides the foundational layer for specialized AI
                across various
                <br />
                organizational departments.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="h-auto justify-start gap-2 px-0 py-0 text-violet-400 hover:bg-transparent hover:text-violet-400"
          >
            <span className="[font-family:'Inter',Helvetica] text-base font-normal leading-6 tracking-[0]">
              Explore Use Cases
            </span>
            <img
              className="shrink-0"
              alt="Container"
              src="/figmaAssets/container.svg"
            />
          </Button>
        </header>
        <div className="grid h-fit grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {useCases.map((useCase) => (
            <article
              key={useCase.title}
              className="flex h-fit w-full flex-col items-start gap-2"
            >
              <Card className="relative w-full overflow-hidden rounded-2xl border border-solid border-white/10 bg-[#ffffff0d] shadow-none">
                <CardContent className="relative p-0">
                  <div
                    className={`relative h-[387.33px] w-full bg-cover bg-[50%_50%] opacity-50 ${useCase.imageClass}`}
                  />
                  <div className="pointer-events-none absolute inset-px bg-[linear-gradient(0deg,rgba(11,15,26,1)_0%,rgba(11,15,26,0)_100%)]" />
                  <div className="absolute bottom-[23px] left-[25px] inline-flex flex-col items-start">
                    <div
                      className={`inline-flex items-start rounded px-3 py-[2.5px] ${useCase.tagWrapperClass}`}
                    >
                      <span
                        className={`mt-[-1.00px] [font-family:'Inter',Helvetica] text-[10px] font-normal leading-[15px] tracking-[1.00px] whitespace-nowrap ${useCase.tagTextClass}`}
                      >
                        {useCase.tag}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex w-full flex-col items-start pt-4">
                <h3 className="mt-[-1.00px] w-full [font-family:'Inter',Helvetica] text-base font-normal leading-6 tracking-[0] text-white">
                  {useCase.title}
                </h3>
              </div>
              <div className="flex w-full flex-col items-start">
                <p className="mt-[-1.00px] w-full [font-family:'Inter',Helvetica] text-base font-normal leading-6 tracking-[0] text-slate-400">
                  {useCase.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
