"use client";

import { useEffect, useRef } from "react";

function hash(x: number, y: number, z: number) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function noise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = smooth(x - xi), v = smooth(y - yi), w = smooth(z - zi);
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w
  );
}

const GLYPHS = ["/", "|", "\\", "-"];
const CW = 7;
const CH = 13;

export default function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dark = window.matchMedia("(prefers-color-scheme: dark)");
    let w = 0, h = 0, raf = 0, last = 0;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    };

    const draw = (t: number) => {
      const time = t / 6000;
      const base = dark.matches ? "200,200,200" : "120,128,140";
      const accent = "23,160,250";
      ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / CW), rows = Math.ceil(h / CH);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * CW + CW / 2, y = r * CH + CH / 2;
          const n = noise(c * 0.06 + time * 0.6, r * 0.11, time);
          const dx = x - mouse.x, dy = y - mouse.y;
          const near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 140);
          const grain = hash(c, r, 7);
          const vis = n + near * 0.45 - grain * 0.12;
          if (vis < 0.52) continue;
          const g = noise(c * 0.025 - time * 0.3, r * 0.05, time * 0.5 + 10);
          const glyph = GLYPHS[Math.min(3, Math.floor(g * 4.4))];
          const a = Math.min(1, (vis - 0.52) * 3.5);
          ctx.fillStyle = near > 0.08
            ? `rgba(${accent},${Math.min(1, 0.35 + near) * Math.max(a, near)})`
            : `rgba(${base},${0.6 * a})`;
          ctx.fillText(glyph, x, y);
        }
      }
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 45) return;
      last = t;
      draw(t);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      if (reduce) draw(0);
    };
    const onLeave = () => { mouse.x = mouse.y = -9999; if (reduce) draw(0); };

    resize();
    const ro = new ResizeObserver(() => { resize(); draw(last); });
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    if (reduce) draw(0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="hero-field" aria-hidden="true" />;
}
