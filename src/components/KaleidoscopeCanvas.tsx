import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
} from "react";
import type { ColorModeId } from "@/lib/color-modes";
import { getColorMode, sampleColor } from "@/lib/color-modes";
import {
  heartbeatThump,
  updateThrum,
  wetDrag,
} from "@/lib/nightmare-audio";

export type KaleidoscopeSettings = {
  segments: number;
  colorMode: ColorModeId;
  brushSize: number;
  trail: number;
  symmetryFlip: boolean;
  frozen: boolean;
  soundOn: boolean;
};

export type KaleidoscopeHandle = {
  clear: () => void;
  randomize: () => void;
  exportPng: () => void;
  seedDemo: () => void;
};

type Props = {
  settings: KaleidoscopeSettings;
  className?: string;
};

type Point = { x: number; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rotatePoint(x: number, y: number, angle: number): Point {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: x * c - y * s, y: x * s + y * c };
}

export const KaleidoscopeCanvas = forwardRef<KaleidoscopeHandle, Props>(
  function KaleidoscopeCanvas({ settings, className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bufferRef = useRef<HTMLCanvasElement | null>(null);
    const settingsRef = useRef(settings);
    settingsRef.current = settings;

    const pointerRef = useRef<{
      active: boolean;
      target: Point;
      smooth: Point;
      last: Point | null;
      hueT: number;
    }>({
      active: false,
      target: { x: 0, y: 0 },
      smooth: { x: 0, y: 0 },
      last: null,
      hueT: Math.random() * 10,
    });

    const autoRef = useRef({
      angle: Math.random() * Math.PI * 2,
      radius: 0.28,
      radiusTarget: 0.38,
      speed: 0.9,
      lastInput: 0,
    });

    const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
    const rafRef = useRef(0);

    const ensureBuffer = useCallback((w: number, h: number) => {
      if (!bufferRef.current) {
        bufferRef.current = document.createElement("canvas");
      }
      const buf = bufferRef.current;
      if (buf.width !== w || buf.height !== h) {
        const prev = document.createElement("canvas");
        prev.width = buf.width;
        prev.height = buf.height;
        const pctx = prev.getContext("2d");
        if (pctx && buf.width > 0) pctx.drawImage(buf, 0, 0);

        buf.width = w;
        buf.height = h;
        const bctx = buf.getContext("2d");
        if (bctx) {
          bctx.fillStyle = "#080305";
          bctx.fillRect(0, 0, w, h);
          if (prev.width > 0) bctx.drawImage(prev, 0, 0, w, h);
        }
      }
      return buf;
    }, []);

    const resize = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        ensureBuffer(w, h);
        sizeRef.current = { w, h, dpr };
      }
    }, [ensureBuffer]);

    const paintStroke = useCallback(
      (
        bctx: CanvasRenderingContext2D,
        from: Point,
        to: Point,
        cx: number,
        cy: number,
        force = 1,
      ) => {
        const s = settingsRef.current;
        const mode = getColorMode(s.colorMode);
        const segments = Math.max(2, Math.min(32, Math.round(s.segments)));
        const wedge = (Math.PI * 2) / segments;
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        const stepSize = Math.max(3, s.brushSize * 0.35);
        const steps = Math.max(1, Math.min(24, Math.ceil(dist / stepSize)));
        const dpr = sizeRef.current.dpr || 1;
        const brush = s.brushSize * (0.7 + force * 0.55) * dpr;

        if (s.soundOn && force > 0.45) {
          wetDrag(Math.min(1, force / 2));
        }

        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          const px = lerp(from.x, to.x, t);
          const py = lerp(from.y, to.y, t);
          const rx = px - cx;
          const ry = py - cy;

          pointerRef.current.hueT += 0.02 + force * 0.02;
          const col = sampleColor(
            mode,
            pointerRef.current.hueT,
            Math.sin(pointerRef.current.hueT * 3 + t) * 0.5,
          );
          const lBoost = Math.min(0.8, col.l + 0.14);
          const sBoost = Math.min(1, col.s + 0.08);
          const core = `hsla(${col.h.toFixed(0)} ${(sBoost * 100).toFixed(0)}% ${(lBoost * 100).toFixed(0)}% / 0.78)`;
          const glow = `hsla(${col.h.toFixed(0)} ${(sBoost * 100).toFixed(0)}% ${((lBoost - 0.05) * 100).toFixed(0)}% / 0.22)`;
          const shine = `hsla(${col.h.toFixed(0)} 25% 94% / 0.18)`;
          const r =
            brush * (0.75 + 0.3 * Math.sin(pointerRef.current.hueT * 5 + t));

          for (let i = 0; i < segments; i++) {
            let lx = rx;
            let ly = ry;
            if (i % 2 === 1) {
              ly = s.symmetryFlip ? -ry : ry;
              if (!s.symmetryFlip) lx = -rx;
            }
            const p = rotatePoint(lx, ly, i * wedge);
            const x = cx + p.x;
            const y = cy + p.y;

            bctx.globalCompositeOperation = "lighter";
            bctx.fillStyle = glow;
            bctx.beginPath();
            bctx.arc(x, y, r * 1.85, 0, Math.PI * 2);
            bctx.fill();

            bctx.globalCompositeOperation = "source-over";
            bctx.fillStyle = core;
            bctx.beginPath();
            bctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
            bctx.fill();

            bctx.fillStyle = shine;
            bctx.beginPath();
            bctx.arc(x - r * 0.12, y - r * 0.14, r * 0.14, 0, Math.PI * 2);
            bctx.fill();
          }
        }
        bctx.globalCompositeOperation = "source-over";
      },
      [],
    );

    const runPath = useCallback(
      (
        bctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        points: Point[],
        force: number,
      ) => {
        for (let i = 1; i < points.length; i++) {
          paintStroke(bctx, points[i - 1]!, points[i]!, cx, cy, force);
        }
      },
      [paintStroke],
    );

    const seedDemo = useCallback(() => {
      const buf = bufferRef.current;
      if (!buf || buf.width < 2) return;
      const bctx = buf.getContext("2d");
      if (!bctx) return;
      const { w, h } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const baseR = Math.min(w, h) * 0.2;

      const spiral: Point[] = [];
      for (let i = 0; i < 160; i++) {
        const a = i * 0.16;
        const r =
          baseR *
          (0.5 +
            0.5 * Math.sin(i * 0.06) +
            0.3 * Math.cos(i * 0.12) +
            0.12 * Math.sin(i * 0.28));
        spiral.push({
          x: cx + Math.cos(a) * r * (1.1 + 0.3 * Math.sin(i * 0.05)),
          y: cy + Math.sin(a * 1.35) * r * (1.05 + 0.25 * Math.cos(i * 0.07)),
        });
      }
      runPath(bctx, cx, cy, spiral, 1.25);

      const ring: Point[] = [];
      for (let i = 0; i < 80; i++) {
        const a = -i * 0.22;
        const r = baseR * 1.5 * (0.85 + 0.15 * Math.sin(i * 0.18));
        ring.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
      }
      runPath(bctx, cx, cy, ring, 1);
    }, [runPath]);

    const clear = useCallback(() => {
      const buf = bufferRef.current;
      if (!buf) return;
      const bctx = buf.getContext("2d");
      if (!bctx) return;
      bctx.globalCompositeOperation = "source-over";
      bctx.fillStyle = "#080305";
      bctx.fillRect(0, 0, buf.width, buf.height);
      pointerRef.current.last = null;
    }, []);

    const randomize = useCallback(() => {
      clear();
      const buf = bufferRef.current;
      if (!buf) return;
      const bctx = buf.getContext("2d");
      if (!bctx) return;
      const { w, h } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;

      for (let k = 0; k < 5; k++) {
        const pts: Point[] = [];
        const a0 = Math.random() * Math.PI * 2;
        const r0 = Math.min(w, h) * (0.08 + Math.random() * 0.32);
        for (let i = 0; i < 36; i++) {
          const a = a0 + i * (0.08 + Math.random() * 0.1);
          const r = r0 * (0.7 + Math.random() * 0.7);
          pts.push({
            x: cx + Math.cos(a) * r,
            y: cy + Math.sin(a) * r * (0.9 + Math.random() * 0.2),
          });
        }
        runPath(bctx, cx, cy, pts, 0.85 + Math.random() * 0.6);
      }

      autoRef.current.angle = Math.random() * Math.PI * 2;
      autoRef.current.radius = 0.15 + Math.random() * 0.35;
      autoRef.current.radiusTarget = 0.2 + Math.random() * 0.4;
      autoRef.current.speed = 0.5 + Math.random() * 1.2;
    }, [clear, runPath]);

    const exportPng = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement("a");
      const stamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      link.download = `skin-of-sin-nightmare-mirror-${stamp}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }, []);

    useImperativeHandle(
      ref,
      () => ({ clear, randomize, exportPng, seedDemo }),
      [clear, randomize, exportPng, seedDemo],
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const toLocal = (clientX: number, clientY: number): Point => {
        const rect = canvas.getBoundingClientRect();
        const { dpr } = sizeRef.current;
        return {
          x: (clientX - rect.left) * dpr,
          y: (clientY - rect.top) * dpr,
        };
      };

      const onDown = (e: PointerEvent) => {
        canvas.setPointerCapture(e.pointerId);
        const p = toLocal(e.clientX, e.clientY);
        pointerRef.current.active = true;
        pointerRef.current.target = p;
        pointerRef.current.smooth = p;
        pointerRef.current.last = p;
        autoRef.current.lastInput = performance.now();
      };

      const onMove = (e: PointerEvent) => {
        pointerRef.current.target = toLocal(e.clientX, e.clientY);
        pointerRef.current.active = true;
        autoRef.current.lastInput = performance.now();
      };

      const onUp = (e: PointerEvent) => {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      };

      const onLeave = () => {
        pointerRef.current.active = false;
        pointerRef.current.last = null;
      };

      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);
      canvas.addEventListener("pointerleave", onLeave);

      return () => {
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onUp);
        canvas.removeEventListener("pointerleave", onLeave);
      };
    }, []);

    useEffect(() => {
      resize();
      const ro = new ResizeObserver(() => resize());
      if (canvasRef.current?.parentElement) {
        ro.observe(canvasRef.current.parentElement);
      }

      let lastTs = performance.now();
      let seeded = false;
      autoRef.current.lastInput = performance.now();

      const frame = (ts: number) => {
        rafRef.current = requestAnimationFrame(frame);
        const dt = Math.min(48, ts - lastTs);
        lastTs = ts;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { w, h } = sizeRef.current;
        if (w < 2 || h < 2) return;

        const buf = ensureBuffer(w, h);
        const bctx = buf.getContext("2d");
        if (!bctx) return;

        if (!seeded) {
          seeded = true;
          seedDemo();
        }

        const s = settingsRef.current;
        const cx = w / 2;
        const cy = h / 2;
        const frozen = s.frozen;

        if (s.soundOn && !frozen) {
          heartbeatThump();
          updateThrum(s.segments, frozen);
        }

        if (!frozen) {
          const fadeStrength = 0.055 * (1 - (s.trail - 1) / 19) + 0.005;
          bctx.globalCompositeOperation = "source-over";
          bctx.fillStyle = `rgba(8, 3, 5, ${fadeStrength.toFixed(4)})`;
          bctx.fillRect(0, 0, w, h);
        }

        const ptr = pointerRef.current;
        const auto = autoRef.current;
        const idle = ts - auto.lastInput > 1600;

        if (!frozen && idle) {
          auto.angle += auto.speed * 0.0014 * dt;
          auto.radius = lerp(auto.radius, auto.radiusTarget, 0.012);
          if (Math.random() < 0.01) {
            auto.radiusTarget = 0.12 + Math.random() * 0.42;
            auto.speed = 0.45 + Math.random() * 1.5;
          }
          const maxR = Math.min(w, h) * 0.48 * auto.radius;
          const wobble = Math.sin(ts * 0.0012) * 0.18;
          ptr.target = {
            x: cx + Math.cos(auto.angle) * maxR * (1 + wobble),
            y: cy + Math.sin(auto.angle * 1.21) * maxR * (1 - wobble * 0.45),
          };
          ptr.active = true;
        }

        const smoothAmt = 1 - Math.exp(-0.016 * dt);
        ptr.smooth.x = lerp(ptr.smooth.x, ptr.target.x, smoothAmt);
        ptr.smooth.y = lerp(ptr.smooth.y, ptr.target.y, smoothAmt);

        if (!frozen && ptr.active) {
          const last = ptr.last ?? ptr.smooth;
          const speed = Math.hypot(
            ptr.smooth.x - last.x,
            ptr.smooth.y - last.y,
          );
          const force = clamp(speed / 10, 0.35, 2);
          if (speed > 0.4 || idle) {
            paintStroke(bctx, last, ptr.smooth, cx, cy, force);
          }
          ptr.last = { ...ptr.smooth };
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(buf, 0, 0);

        const vig = ctx.createRadialGradient(
          cx,
          cy,
          Math.min(w, h) * 0.22,
          cx,
          cy,
          Math.min(w, h) * 0.78,
        );
        vig.addColorStop(0, "transparent");
        vig.addColorStop(0.72, "rgba(6, 2, 3, 0.1)");
        vig.addColorStop(1, "rgba(3, 1, 2, 0.62)");
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, w, h);

        const irisR = Math.min(w, h) * 0.05;
        const iris = ctx.createRadialGradient(cx, cy, 0, cx, cy, irisR);
        iris.addColorStop(0, "rgba(232, 170, 150, 0.14)");
        iris.addColorStop(1, "transparent");
        ctx.fillStyle = iris;
        ctx.beginPath();
        ctx.arc(cx, cy, irisR, 0, Math.PI * 2);
        ctx.fill();

        if (frozen) {
          ctx.strokeStyle = "rgba(196, 120, 106, 0.35)";
          ctx.lineWidth = Math.max(2, sizeRef.current.dpr * 1.5);
          const pad = 10 * sizeRef.current.dpr;
          ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
        }
      };

      rafRef.current = requestAnimationFrame(frame);
      return () => {
        cancelAnimationFrame(rafRef.current);
        ro.disconnect();
      };
    }, [ensureBuffer, paintStroke, resize, seedDemo]);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          touchAction: "none",
          cursor: "crosshair",
        }}
        aria-label="Nightmare Mirror canvas — drag to paint mirrored patterns"
      />
    );
  },
);
