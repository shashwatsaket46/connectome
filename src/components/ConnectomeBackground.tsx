import { useEffect, useRef } from "react";

import { useTheme } from "@/lib/theme";

type Node = { x: number; y: number; r: number; vx: number; vy: number; lobe: number };
type Edge = { a: number; b: number; w: number };
type Spike = { e: number; t: number; speed: number };

// A drifting fruit-fly connectome: two optic lobes + a central brain cluster,
// wired with short-range edges and travelling action-potential spikes.
export function ConnectomeBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let spikes: Spike[] = [];
    let raf = 0;

    // Fly-brain silhouette: left lobe, right lobe, central complex.
    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const scale = Math.min(w, h);
      const clusters = [
        { cx: w * 0.5 - scale * 0.3, cy: h * 0.48, rx: scale * 0.2, ry: scale * 0.26, n: 46 },
        { cx: w * 0.5 + scale * 0.3, cy: h * 0.48, rx: scale * 0.2, ry: scale * 0.26, n: 46 },
        { cx: w * 0.5, cy: h * 0.52, rx: scale * 0.15, ry: scale * 0.17, n: 34 },
      ];

      nodes = [];
      clusters.forEach((c, lobe) => {
        for (let i = 0; i < c.n; i += 1) {
          const a = Math.random() * Math.PI * 2;
          const rad = Math.sqrt(Math.random());
          nodes.push({
            x: c.cx + Math.cos(a) * c.rx * rad,
            y: c.cy + Math.sin(a) * c.ry * rad,
            r: 0.8 + Math.random() * 1.9,
            vx: (Math.random() - 0.5) * 0.09,
            vy: (Math.random() - 0.5) * 0.09,
            lobe,
          });
        }
      });

      const near = scale * 0.11;
      edges = [];
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[i]!.x - nodes[j]!.x;
          const dy = nodes[i]!.y - nodes[j]!.y;
          const d = Math.hypot(dx, dy);
          const sameLobe = nodes[i]!.lobe === nodes[j]!.lobe;
          // Long commissural tracts only between lobe and central complex.
          if (d < near || (!sameLobe && d < near * 2.4 && Math.random() < 0.03)) {
            edges.push({ a: i, b: j, w: sameLobe ? 0.5 : 0.85 });
          }
        }
      }
      spikes = Array.from({ length: Math.min(26, Math.floor(edges.length / 8)) }, () => ({
        e: Math.floor(Math.random() * edges.length),
        t: Math.random(),
        speed: 0.004 + Math.random() * 0.01,
      }));
    };

    const lobeColors = [
      { h: 280, s: 80, l: 58 }, // left optic: violet
      { h: 22, s: 90, l: 56 }, // right optic: orange
      { h: 190, s: 88, l: 48 }, // central: teal-cyan
    ] as const;

    const draw = () => {
      const dark = themeRef.current === "dark";
      const alpha = dark ? 0.85 : 1;

      ctx.clearRect(0, 0, w, h);

      for (const e of edges) {
        const a = nodes[e.a]!;
        const b = nodes[e.b]!;
        const ca = lobeColors[a.lobe]!;
        const cb = lobeColors[b.lobe]!;
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, `hsla(${ca.h}, ${ca.s}%, ${ca.l}%, ${0.22 * e.w * alpha})`);
        grad.addColorStop(1, `hsla(${cb.h}, ${cb.s}%, ${cb.l}%, ${0.22 * e.w * alpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = e.w;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      for (const n of nodes) {
        const c = lobeColors[n.lobe]!;
        ctx.fillStyle = `hsla(${c.h}, ${c.s}%, ${Math.min(100, c.l + 8)}%, ${0.55 * alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const s of spikes) {
        const e = edges[s.e];
        if (!e) continue;
        const a = nodes[e.a]!;
        const b = nodes[e.b]!;
        const x = a.x + (b.x - a.x) * s.t;
        const y = a.y + (b.y - a.y) * s.t;
        const ca = lobeColors[a.lobe]!;
        ctx.fillStyle = `hsl(${ca.h}, 100%, ${dark ? 70 : 60}%)`;
        ctx.globalAlpha = 0.65 * Math.sin(Math.PI * s.t) * alpha;
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };


    const step = () => {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      for (const s of spikes) {
        s.t += s.speed;
        if (s.t > 1) {
          s.t = 0;
          s.e = Math.floor(Math.random() * edges.length);
        }
      }
      draw();
      raf = window.requestAnimationFrame(step);
    };

    build();
    if (reduced) draw();
    else raf = window.requestAnimationFrame(step);

    const onResize = () => {
      build();
      draw();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <canvas ref={canvasRef} className="h-full w-full opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background/70" />
    </div>
  );
}
