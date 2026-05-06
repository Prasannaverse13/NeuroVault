import { Button } from "@/components/ui/button";

export const PrimaryNavigationSection = (): JSX.Element => {
  const navItems = [
    { label: "Status", active: true },
    { label: "Docs", active: false },
  ];

  return (
    <header className="relative z-10 w-full border-b border-[#ffffff0d] bg-[#0b0f1a66] backdrop-blur-[20px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(20px)_brightness(100%)]">
      <div className="flex h-16 w-full items-center justify-between px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-8">
          <a
            href="#"
            className="flex items-center [font-family:'Inter',Helvetica] text-lg font-normal leading-7 tracking-[-0.90px] text-white"
          >
            NeuroVault
          </a>
          <nav aria-label="Primary navigation">
            <ul className="flex items-center gap-4 sm:gap-6">
              {navItems.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    className={`h-auto [font-family:'Inter',Helvetica] text-sm font-normal leading-5 tracking-[0] transition-colors ${
                      item.active
                        ? "text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            className="h-auto [font-family:'Inter',Helvetica] text-center text-sm font-normal leading-5 tracking-[0] text-slate-400 transition-colors hover:text-white"
          >
            Workspace
          </button>
          <Button
            type="button"
            className="h-auto rounded-lg bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] px-3 py-2 shadow-[0px_0px_15px_#8b5cf633] [font-family:'Inter',Helvetica] text-sm font-normal leading-5 tracking-[0] text-white hover:opacity-95 sm:px-5"
          >
            Upgrade Plan
          </Button>
          <button
            type="button"
            aria-label="Account options"
            className="flex h-auto items-center justify-center"
          >
            <img
              className="block shrink-0"
              alt="Margin"
              src="/figmaAssets/margin-1.svg"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
