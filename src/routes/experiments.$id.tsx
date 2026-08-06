import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";


import { useTheme } from "@/lib/theme";
import { useExperiments } from "@/lib/experiments";
import { setSections, useSections, type ExperimentSection } from "@/lib/sections";

export const Route = createFileRoute("/experiments/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: typeof search["view"] === "string" ? (search["view"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Experiment viewer — ConnectionMiner Experiment Hub" },
      {
        name: "description",
        content:
          "Open a self-contained ConnectionMiner experiment dashboard inside the hub's microfrontend viewer.",
      },
      { property: "og:title", content: "Experiment viewer — ConnectionMiner" },
      {
        property: "og:description",
        content: "Self-contained interactive experiment dashboards, loaded on demand.",
      },
    ],
  }),
  component: ExperimentViewer,
});

function ExperimentViewer() {
  const { id } = Route.useParams();
  const { view } = Route.useSearch();
  const navigate = useNavigate();
  const { experiments } = useExperiments();
  const { theme } = useTheme();
  const [childTitle, setChildTitle] = useState<string | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  const enabled = experiments.filter((e) => e.enabled);
  const index = enabled.findIndex((e) => e.id === id);
  const prev = index > 0 ? enabled[index - 1] : undefined;
  const next = index >= 0 && index < enabled.length - 1 ? enabled[index + 1] : undefined;
  const experiment = experiments.find((e) => e.id === id);
  // Built-in bundles are proxied so they render as live pages instead of
  // being served as file downloads by the asset CDN.
  const embedUrl =
    experiment && !experiment.custom && experiment.url.startsWith("/__l5e/")
      ? `/api/public/experiment/${experiment.id}`
      : experiment?.url;

  // Parent <-> child bridge. Each experiment page is an independent document;
  // this is the only coupling between the shell and a child microfrontend.
  useEffect(() => {
    setChildTitle(null);

    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string;
        id?: string;
        title?: string;
        sections?: ExperimentSection[];
      } | null;
      if (!data || typeof data.type !== "string" || !data.type.startsWith("hub:")) return;
      if (data.type === "hub:title" && data.title) setChildTitle(data.title);
      if (data.type === "hub:sections" && Array.isArray(data.sections)) {
        setSections(id, data.sections);
      }
      if (data.type === "hub:theme?" || data.type === "hub:ready") {
        frameRef.current?.contentWindow?.postMessage({ type: "hub:theme", theme }, "*");
      }
      if (data.type === "hub:navigate" && data.id) {
        navigate({ to: "/experiments/$id", params: { id: data.id } });
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [id, navigate, theme]);

  // Keep the embedded experiment in sync with the hub theme.
  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage({ type: "hub:theme", theme }, "*");
  }, [theme, id]);

  const sections = useSections(id);

  // The bundles are large and their load event can lag well behind the plot
  // being interactive, so keep re-sending the selection until the child acks.
  useEffect(() => {
    if (!view) return;
    let done = false;
    const ack = (event: MessageEvent) => {
      const data = event.data as { type?: string; key?: string } | null;
      if (data?.type === "hub:selected" && data.key === view) done = true;
    };
    window.addEventListener("message", ack);
    const send = () =>
      frameRef.current?.contentWindow?.postMessage({ type: "hub:select", key: view }, "*");
    send();
    const timer = window.setInterval(() => {
      if (done) window.clearInterval(timer);
      else send();
    }, 700);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("message", ack);
    };
  }, [view, id]);

  const announce = () => {
    frameRef.current?.contentWindow?.postMessage(
      {
        type: "hub:theme",
        theme,
      },
      "*",
    );
    frameRef.current?.contentWindow?.postMessage(
      {
        type: "hub:context",
        current: id,
        experiments: enabled.map((e) => ({ id: e.id, title: e.title, category: e.category })),
      },
      "*",
    );
  };

  if (!experiment) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-xl font-semibold">Experiment not registered</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No experiment with id <code className="text-foreground">{id}</code> exists in the
          registry.
        </p>
        <Link to="/manage" className="mt-5 inline-block text-sm font-semibold text-primary">
          Register it →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-sidebar px-5 py-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary">
            {experiment.category}
          </p>
          <h1 className="truncate text-sm font-semibold">{childTitle ?? experiment.title}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {prev && (
            <Link
              to="/experiments/$id"
              params={{ id: prev.id }}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:border-primary"
            >
              ← Previous
            </Link>
          )}
          {next && (
            <Link
              to="/experiments/$id"
              params={{ id: next.id }}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:border-primary"
            >
              Next →
            </Link>
          )}
          <a
            href={embedUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:border-primary"
          >
            Open standalone ↗
          </a>
          <Link
            to="/"
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:border-primary"
          >
            All experiments
          </Link>
        </div>
      </div>

      <div className="relative flex-1 bg-card">
        <iframe
          ref={frameRef}
          key={experiment.id}
          src={embedUrl}
          title={experiment.title}
          onLoad={announce}
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}

