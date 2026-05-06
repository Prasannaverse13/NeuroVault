import { Badge } from "@/components/ui/badge";

const footerLinks = [
  { label: "DOCS", href: "#infrastructure" },
  { label: "GITHUB", href: "https://github.com/neurovault", external: true },
  { label: "PRIVACY POLICY", href: "#footer" },
  { label: "TERMS", href: "#footer" },
];

export const ProductFooterSection = (): JSX.Element => {
  const handleClick = (href: string, external?: boolean) => {
    if (external) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else if (href.startsWith("#")) {
      const id = href.slice(1);
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="relative w-full border-t border-[#ffffff0d] bg-transparent px-4 py-5 opacity-70 sm:px-6 md:px-10 lg:px-12">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="[font-family:'Inter',Helvetica] text-[10px] font-normal leading-[15px] tracking-[1.00px] text-slate-500">
          © 2024 NEUROVAULT ENTERPRISE. COMPUTATIONAL SERENITY.
        </p>
        <nav aria-label="Footer navigation" className="order-3 md:order-2">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 md:gap-8">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <button
                  type="button"
                  data-testid={`button-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => handleClick(link.href, link.external)}
                  className="h-auto p-0 [font-family:'Inter',Helvetica] text-[10px] font-normal leading-[15px] tracking-[1.00px] text-slate-600 no-underline transition-colors hover:text-slate-400"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="order-2 md:order-3">
          <Badge className="h-auto rounded border border-[#ffffff1a] bg-[#ffffff08] px-3 py-1 [font-family:'Inter',Helvetica] text-[10px] font-normal leading-[15px] tracking-[0.50px] text-white backdrop-blur-[10px] backdrop-brightness-[100%] hover:bg-[#ffffff08] [-webkit-backdrop-filter:blur(10px)_brightness(100%)]">
            <span
              className="mr-2 inline-block h-2 w-2 rounded-full bg-cyan-400"
              aria-hidden="true"
            />
            HACKATHON WINNER
          </Badge>
        </div>
      </div>
    </footer>
  );
};
