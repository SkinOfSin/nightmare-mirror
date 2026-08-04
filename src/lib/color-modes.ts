export type ColorModeId =
  | "flesh"
  | "bruise"
  | "scarlet"
  | "ichor"
  | "fever"
  | "sin"
  | "bone"
  | "prism";

export type ColorMode = {
  id: ColorModeId;
  label: string;
  description: string;
  /** Base hues in degrees (0–360) sampled for strokes */
  hues: number[];
  saturation: [number, number];
  lightness: [number, number];
  glow: string;
};

export const COLOR_MODES: ColorMode[] = [
  {
    id: "flesh",
    label: "Raw Flesh",
    description: "Warm skin, wound pink, pale membrane",
    hues: [0, 8, 18, 350, 25],
    saturation: [0.35, 0.72],
    lightness: [0.42, 0.72],
    glow: "rgba(232, 160, 144, 0.35)",
  },
  {
    id: "bruise",
    label: "Bruise",
    description: "Violet contusion, cyan undertone, yellow fade",
    hues: [270, 285, 200, 48, 310],
    saturation: [0.3, 0.65],
    lightness: [0.28, 0.58],
    glow: "rgba(120, 90, 160, 0.4)",
  },
  {
    id: "scarlet",
    label: "Arterial",
    description: "Deep blood, bright arterial spray",
    hues: [0, 350, 8, 355, 15],
    saturation: [0.7, 0.95],
    lightness: [0.22, 0.55],
    glow: "rgba(180, 30, 45, 0.45)",
  },
  {
    id: "ichor",
    label: "Ichor",
    description: "Sickly green-black, bile gold",
    hues: [85, 100, 70, 45, 120],
    saturation: [0.35, 0.75],
    lightness: [0.18, 0.48],
    glow: "rgba(90, 120, 40, 0.4)",
  },
  {
    id: "fever",
    label: "Fever",
    description: "Heat flush, jaundice, inflammation",
    hues: [15, 30, 45, 5, 55],
    saturation: [0.55, 0.9],
    lightness: [0.35, 0.65],
    glow: "rgba(220, 120, 40, 0.4)",
  },
  {
    id: "sin",
    label: "Skin of Sin",
    description: "Blood, gold, charcoal, forbidden pink",
    hues: [0, 42, 330, 15, 280, 50],
    saturation: [0.4, 0.9],
    lightness: [0.2, 0.62],
    glow: "rgba(180, 60, 50, 0.45)",
  },
  {
    id: "bone",
    label: "Bone & Ash",
    description: "Pale ivory, smoke gray, faint rust",
    hues: [30, 20, 0, 40, 210],
    saturation: [0.05, 0.28],
    lightness: [0.45, 0.88],
    glow: "rgba(232, 216, 200, 0.3)",
  },
  {
    id: "prism",
    label: "Prism Veil",
    description: "Full spectrum through wet membrane",
    hues: [0, 40, 80, 140, 200, 260, 320],
    saturation: [0.55, 0.95],
    lightness: [0.35, 0.65],
    glow: "rgba(200, 140, 180, 0.35)",
  },
];

export function getColorMode(id: ColorModeId): ColorMode {
  return COLOR_MODES.find((m) => m.id === id) ?? COLOR_MODES[0]!;
}

export function sampleColor(
  mode: ColorMode,
  t: number,
  variance = 0,
): { h: number; s: number; l: number; css: string } {
  const hues = mode.hues;
  const idx = Math.floor(Math.abs(t) * hues.length) % hues.length;
  const h =
    (hues[idx]! + variance * 18 + Math.sin(t * 12.7) * 8 + 360) % 360;
  const s =
    mode.saturation[0] +
    (mode.saturation[1] - mode.saturation[0]) *
      (0.5 + 0.5 * Math.sin(t * 7.3 + variance));
  const l =
    mode.lightness[0] +
    (mode.lightness[1] - mode.lightness[0]) *
      (0.5 + 0.5 * Math.cos(t * 5.1 + variance * 2));
  const css = `hsl(${h.toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%)`;
  return { h, s, l, css };
}
