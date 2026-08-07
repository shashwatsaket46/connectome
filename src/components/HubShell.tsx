import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { ConnectomeBackground } from "@/components/ConnectomeBackground";
import { useExperiments } from "@/lib/experiments";
import { useSections } from "@/lib/sections";
import { useTheme } from "@/lib/theme";

export function HubShell({ children }: { children: ReactNode }) {
  const { experiments } = useExperiments();
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const enabled = experiments.filter((e) => e.enabled);
  const categories = Array.from(new Set(enabled.map((e) => e.category)));
  const activeId = pathname.startsWith("/experiments/")
    ? decodeURIComponent(pathname.slice("/experiments/".length))
    : undefined;
  const detected = useSections(activeId);
  // Only the UMAP experiment exposes per-family sub-views in the menu.
  const sections = activeId === "umap-vs-confusion" ? detected : [];

  return (
    <div className="flex min-h-screen text-foreground">
      {!activeId && <ConnectomeBackground />}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-border bg-sidebar/85 backdrop-blur md:flex">
        <div className="border-b border-border px-5 py-5">
          <Link to="/" className="block">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary">
              ConnectionMiner
            </p>
            <h1 className="mt-1 text-lg font-semibold leading-tight">Experiment Hub</h1>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <SideLink to="/" label="Start — Connectome map" active={pathname === "/"} />
          <SideLink to="/registry" label="All experiments" active={pathname === "/registry"} />

          {categories.map((cat) => (
            <div key={cat} className="mt-5">
              <p className="px-2 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {cat}
              </p>
              {enabled
                .filter((e) => e.category === cat)
                .map((e) => (
                  <div key={e.id}>
                    <SideLink
                      to="/experiments/$id"
                      params={{ id: e.id }}
                      label={e.title}
                      active={pathname === `/experiments/${e.id}`}
                    />
                    {activeId === e.id && sections.length > 0 && (
                      <ul className="mb-2 ml-3 border-l border-border pl-2">
                        {sections.map((s) => (
                          <li key={s.key}>
                            <Link
                              to="/experiments/$id"
                              params={{ id: e.id }}
                              search={{ view: s.key }}
                              className="block rounded-md px-2 py-1.5 text-xs leading-snug text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground data-[status=active]:text-foreground"
                              activeOptions={{ includeSearch: true }}
                              activeProps={{
                                className:
                                  "block rounded-md bg-accent px-2 py-1.5 text-xs font-semibold leading-snug text-accent-foreground",
                              }}
                            >
                              {s.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-border px-3 py-3">
          <SideLink to="/manage" label="Manage experiments" active={pathname === "/manage"} />
          <ThemeToggle theme={theme} toggle={toggle} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3 md:hidden">
          <Link to="/" className="text-sm font-semibold">
            Experiment Hub
          </Link>
          <Link to="/manage" className="ml-auto text-sm text-primary">
            Manage
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="rounded-md border border-border px-2 py-1 text-sm"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function ThemeToggle({ theme, toggle }: { theme: string; toggle: () => void }) {
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
    >
      <span aria-hidden>{dark ? "☀️" : "🌙"}</span>
      <span>{dark ? "Light mode" : "Dark mode"}</span>
      <span
        className={`ml-auto flex h-5 w-9 items-center rounded-full border border-border p-0.5 transition-colors ${
          dark ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`h-3.5 w-3.5 rounded-full bg-background transition-transform ${
            dark ? "translate-x-4" : ""
          }`}
        />
      </span>
    </button>
  );
}

function SideLink({
  to,
  params,
  label,
  active,
}: {
  to: string;
  params?: Record<string, string>;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      params={params as never}
      className={`block rounded-md px-2.5 py-2 text-sm leading-snug transition-colors ${
        active
          ? "bg-accent font-semibold text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
