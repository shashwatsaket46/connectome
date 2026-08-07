import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import type { Experiment } from "@/lib/experiments";
import { useTheme } from "@/lib/theme";

type N = { x: number; y: number; r: number; vx: number; vy: number; lobe: number; e: number };
type E = { a: number; b: number; w: number };
type S = { e: number; t: number; sp: number };

// Anatomical-ish hotspot slots on the fly brain (percent of the canvas box).
const SLOTS = [
  { x: 15, y: 30, label: "Left optic lobe" },
  { x: 15, y: 66, label: "Left lobula plate" },
  { x: 50, y: 16, label: "Central complex" },
  { x: 50, y: 82, label: "Sub-esophageal zone" },
  { x: 85, y: 30, label: "Right optic lobe" },
  { x: 85, y: 66, label: "Right medulla" },
  { x: 31, y: 48, label: "Left commissure" },
  { x: 69, y: 48, label: "Right commissure" },
];

export function ConnectomeMap({ experiments }: { experiments: Experiment[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const [hover, setHover] = useState<number | null>(null);

  const pinned = experiments.slice(0, SLOTS.length);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let nodes: N[] = [];
    let edges: E[] = [];
    let spikes: S[] = [];
    let raf = 0;
    const mouse = { x: -9999, y: -9999 };

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const s = Math.min(w, h * 1.5);
      const clusters = [
        { cx: w * 0.16, cy: h * 0.48, rx: s * 0.13, ry: h * 0.34, n: 90 },
        { cx: w * 0.84, cy: h * 0.48, rx: s * 0.13, ry: h * 0.34, n: 90 },
        { cx: w * 0.5, cy: h * 0.5, rx: s * 0.15, ry: h * 0.3, n: 80 },
        { cx: w * 0.33, cy: h * 0.5, rx: s * 0.07, ry: h * 0.2, n: 34 },
        { cx: w * 0.67, cy: h * 0.5, rx: s * 0.07, ry: h * 0.2, n: 34 },
      ];

      nodes = [];
      clusters.forEach((c, lobe) => {
        for (let i = 0; i < c.n; i += 1) {
          const a = Math.random() * Math.PI * 2;
          const rad = Math.sqrt(Math.random());
          nodes.push({
            x: c.cx + Math.cos(a) * c.rx * rad,
            y: c.cy + Math.sin(a) * c.ry * rad,
            r: 0.7 + Math.random() * 2.1,
            vx: (Math.random() - 0.5) * 0.1,
            vy: (Math.random() - 0.5) * 0.1,
            lobe,
            e: 0,
          });
        }
      });

      edges = [];
      const linkR = Math.max(46, s * 0.09);
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const ni = nodes[i]!;
          const nj = nodes[j]!;
          const d = Math.hypot(ni.x - nj.x, ni.y - nj.y);
          const same = ni.lobe === nj.lobe;
          if (d < linkR && (same || Math.random() < 0.05)) {
            edges.push({ a: i, b: j, w: 1 - d / linkR });
          }
        }
      }
      spikes = Array.from({ length: Math.min(70, edges.length) }, () => ({
        e: Math.floor(Math.random() * edges.length),
        t: Math.random(),
        sp: 0.004 + Math.random() * 0.012,
      }));
    };

    const lobeColors = [
      { h: 280, s: 80, l: 58 }, // left optic: violet
      { h: 22, s: 90, l: 56 }, // right optic: orange
      { h: 190, s: 88, l: 48 }, // central: teal-cyan
      { h: 95, s: 75, l: 42 }, // left commissure: lime
      { h: 340, s: 80, l: 58 }, // right commissure: rose-pink
    ] as const;

    const draw = () => {
      const dark = themeRef.current === "dark";
      const alpha = dark ? 0.85 : 1;
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        if (!reduced) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
        const dm = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        n.e = dm < 140 ? Math.max(n.e, 1 - dm / 140) : n.e * 0.94;
      }

      ctx.lineWidth = 1;
      for (const e of edges) {
        const a = nodes[e.a]!;
        const b = nodes[e.b]!;
        const ex = Math.max(a.e, b.e);
        const ca = lobeColors[a.lobe]!;
        const cb = lobeColors[b.lobe]!;
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, `hsla(${ca.h}, ${ca.s}%, ${ca.l}%, ${(0.12 + ex * 0.55) * e.w * alpha})`);
        grad.addColorStop(1, `hsla(${cb.h}, ${cb.s}%, ${cb.l}%, ${(0.12 + ex * 0.55) * e.w * alpha})`);
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      for (const n of nodes) {
        const c = lobeColors[n.lobe]!;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + n.e * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${c.h}, ${c.s}%, ${Math.min(100, c.l + 8)}%, ${(0.45 + n.e * 0.55) * alpha})`;
        ctx.fill();
      }

      if (!reduced) {
        for (const sp of spikes) {
          const e = edges[sp.e];
          if (!e) continue;
          sp.t += sp.sp;
          if (sp.t > 1) {
            sp.t = 0;
            sp.e = Math.floor(Math.random() * edges.length);
          }
          const a = nodes[e.a]!;
          const b = nodes[e.b]!;
          const x = a.x + (b.x - a.x) * sp.t;
          const y = a.y + (b.y - a.y) * sp.t;
          const ca = lobeColors[a.lobe]!;
          ctx.globalAlpha = Math.sin(sp.t * Math.PI) * alpha;
          ctx.fillStyle = `hsl(${ca.h}, 100%, ${dark ? 70 : 60}%)`;
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      raf = requestAnimationFrame(draw);
    };



    const onMove = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = ev.clientX - r.left;
      mouse.y = ev.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    build();
    draw();
    const ro = new ResizeObserver(build);
    ro.observe(canvas);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-sm sm:h-[520px]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none absolute inset-0">
        {pinned.map((exp, i) => {
          const slot = SLOTS[i]!;
          const active = hover === i;
          return (
            <Link
              key={exp.id}
              to="/experiments/$id"
              params={{ id: exp.id }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              onFocus={() => setHover(i)}
              onBlur={() => setHover((h) => (h === i ? null : h))}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 outline-none"
              aria-label={`${exp.title} — ${slot.label}`}
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full bg-primary/40 ${
                    active ? "animate-ping" : "animate-pulse"
                  }`}
                />
                <span
                  className={`relative h-3 w-3 rounded-full bg-primary ring-2 ring-background transition-transform ${
                    active ? "scale-150" : ""
                  }`}
                />
              </span>
              <span
                className={`absolute left-1/2 top-6 w-52 -translate-x-1/2 rounded-lg border border-border bg-card/95 p-3 text-left shadow-lg backdrop-blur transition-all ${
                  active ? "visible opacity-100" : "invisible opacity-0"
                }`}
              >
                <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-primary">
                  {slot.label}
                </span>
                <span className="mt-1 block text-xs font-semibold leading-snug">{exp.title}</span>
                <span className="mt-1 block text-[0.7rem] text-primary">Open experiment →</span>
              </span>
            </Link>
          );
        })}
      </div>

      <p className="pointer-events-none absolute bottom-3 left-4 text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
        Drosophila connectome · hover to excite the network · click a probe to open its experiment
      </p>
    </div>
  );
}
