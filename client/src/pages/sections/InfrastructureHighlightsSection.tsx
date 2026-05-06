import { Card, CardContent } from "@/components/ui/card";

const highlightCards = [
  {
    id: "memory",
    title: "Persistent Memory Engine",
    description: [
      "The industry's first long-term memory architecture for LLMs. Store",
      "and retrieve context across unlimited sessions with zero latency",
      "degradation.",
    ],
    icon: {
      src: "/figmaAssets/overlay.svg",
      alt: "Persistent Memory Engine icon",
      className: "h-12 w-12",
    },
    className:
      "md:col-span-2 md:row-span-2 px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:pt-10 lg:pb-[42px]",
    descriptionClassName:
      "[font-family:'Inter',Helvetica] text-sm leading-6 text-slate-400 sm:text-base",
    image: {
      className:
        "mt-2 h-40 w-full rounded-lg border border-solid border-[#ffffff0d] bg-[url(/figmaAssets/ab6axubo-qww246pwyzxcyekoo-8g2thaxpdbltwxdavjv3fyn-abowfs2ywshvx.png)] bg-cover bg-[50%_50%] opacity-40 sm:h-44 lg:h-52",
    },
  },
  {
    id: "identity",
    title: "Agent Identity & Ownership",
    description: [
      "Crytographically secure agent identities ensure full provable",
      "ownership of every intelligence unit deployed.",
    ],
    icon: {
      src: "/figmaAssets/overlay-3.svg",
      alt: "Agent Identity & Ownership icon",
      className: "h-10 w-10",
    },
    className: "md:col-span-2 px-6 py-6 sm:px-8 sm:pt-8 sm:pb-16",
    descriptionClassName:
      "[font-family:'Inter',Helvetica] text-sm leading-6 text-slate-400 sm:text-base",
  },
  {
    id: "privacy",
    title: "Privacy-first (TEE)",
    description: [
      "Computation happens within",
      "Trusted Execution Environments,",
      "ensuring data remains invisible",
      "even to us.",
    ],
    icon: {
      src: "/figmaAssets/overlay-1.svg",
      alt: "Privacy-first (TEE) icon",
      className: "h-10 w-10",
    },
    className: "px-6 py-6 sm:p-8",
    descriptionClassName:
      "[font-family:'Inter',Helvetica] text-sm leading-5 text-slate-400",
  },
  {
    id: "marketplace",
    title: "Agent Marketplace",
    description: [
      "A global exchange for specialized",
      "intelligence modules ready to",
      "integrate into your existing stack.",
    ],
    icon: {
      src: "/figmaAssets/overlay-2.svg",
      alt: "Agent Marketplace icon",
      className: "h-10 w-10",
    },
    className: "px-6 py-6 sm:px-8 sm:pt-8 sm:pb-[52px]",
    descriptionClassName:
      "[font-family:'Inter',Helvetica] text-sm leading-5 text-slate-400",
  },
];

export const InfrastructureHighlightsSection = (): JSX.Element => {
  return (
    <section className="relative w-full px-6 py-20">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col items-start gap-16">
        <header className="flex w-full flex-col items-center gap-4">
          <div className="flex w-full flex-col items-center">
            <h2 className="mt-[-1.00px] w-fit whitespace-nowrap text-center text-base font-normal leading-6 tracking-[0] text-white [font-family:'Inter',Helvetica]">
              Core Infrastructure
            </h2>
          </div>
          <div className="h-1 w-20 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)]" />
        </header>
        <div className="grid h-fit w-full grid-cols-1 gap-6 md:grid-cols-4 md:grid-rows-2">
          {highlightCards.map((card) => (
            <Card
              key={card.id}
              className={`w-full rounded-xl border border-solid border-[#ffffff14] bg-[#ffffff08] shadow-none backdrop-blur-[10px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(10px)_brightness(100%)] ${card.className}`}
            >
              <CardContent className="flex h-full flex-col items-start gap-4 p-0">
                <img
                  className={card.icon.className}
                  alt={card.icon.alt}
                  src={card.icon.src}
                />
                <div className="flex w-full flex-col items-start pt-2">
                  <h3 className="mt-[-1.00px] flex w-full items-center text-base font-normal leading-6 tracking-[0] text-white [font-family:'Inter',Helvetica]">
                    {card.title}
                  </h3>
                </div>
                <div className="flex w-full flex-col items-start">
                  <p
                    className={`mt-[-1.00px] w-full font-normal tracking-[0] ${card.descriptionClassName}`}
                  >
                    {card.description.map((line, index) => (
                      <span key={`${card.id}-line-${index}`}>
                        {line}
                        {index < card.description.length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                </div>
                {card.image ? (
                  <div className={card.image.className} aria-hidden="true" />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
