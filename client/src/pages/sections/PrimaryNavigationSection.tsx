import { Link } from "wouter";

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

interface NavItem {
  label: string;
  target?: string;
  href?: string;
}

export const PrimaryNavigationSection = (): JSX.Element => {
  const navItems: NavItem[] = [
    { label: "Status", target: "infrastructure" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Docs", target: "architecture" },
  ];

  return (
    <header className="sticky top-0 z-10 w-full border-b border-[#ffffff0d] bg-[#0b0f1a66] backdrop-blur-[20px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(20px)_brightness(100%)]">
      <div className="flex h-16 w-full items-center justify-between px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-8">
          <button
            type="button"
            onClick={() => scrollTo("hero")}
            data-testid="link-logo"
            className="flex items-center [font-family:'Inter',Helvetica] text-lg font-normal leading-7 tracking-[-0.90px] text-white"
          >
            NeuroVault
          </button>
          <nav aria-label="Primary navigation">
            <ul className="flex items-center gap-4 sm:gap-6">
              {navItems.map((item) => (
                <li key={item.label}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      data-testid={`button-nav-${item.label.toLowerCase()}`}
                      className="h-auto [font-family:'Inter',Helvetica] text-sm font-normal leading-5 tracking-[0] text-slate-400 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      data-testid={`button-nav-${item.label.toLowerCase()}`}
                      onClick={() => scrollTo(item.target!)}
                      className="h-auto [font-family:'Inter',Helvetica] text-sm font-normal leading-5 tracking-[0] text-slate-400 transition-colors hover:text-white"
                    >
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/auth"
            data-testid="button-sign-in"
            className="h-auto [font-family:'Inter',Helvetica] text-center text-sm font-normal leading-5 tracking-[0] text-slate-400 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            data-testid="button-launch-workspace"
            className="inline-flex h-auto items-center justify-center rounded-lg bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] px-3 py-2 shadow-[0px_0px_15px_#8b5cf633] [font-family:'Inter',Helvetica] text-sm font-normal leading-5 tracking-[0] text-white transition-opacity hover:opacity-95 sm:px-5"
          >
            Launch Workspace
          </Link>
        </div>
      </div>
    </header>
  );
};
