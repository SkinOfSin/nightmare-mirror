import {
  Download,
  Dices,
  Eraser,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState } from "react";
import { COLOR_MODES, type ColorModeId } from "@/lib/color-modes";
import { cn } from "@/lib/utils";
import type { KaleidoscopeSettings } from "./KaleidoscopeCanvas";

type Props = {
  settings: KaleidoscopeSettings;
  onChange: (patch: Partial<KaleidoscopeSettings>) => void;
  onClear: () => void;
  onRandomize: () => void;
  onExport: () => void;
  onToggleSound: () => void;
};

export function ControlPanel({
  settings,
  onChange,
  onClear,
  onRandomize,
  onExport,
  onToggleSound,
}: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div
        className={cn(
          "sin-panel pointer-events-auto w-full max-w-xl rounded-[calc(var(--radius-lg)+4px)]",
          "backdrop-blur-sm",
        )}
      >
        <div className="relative z-[1] p-3 sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-[0.7rem] uppercase tracking-[0.22em] text-fg-subtle">
                Skin of Sin
              </p>
              <h1 className="font-display text-xl leading-tight text-bone sm:text-2xl">
                Nightmare Mirror
              </h1>
              <p className="mt-0.5 text-xs text-fg-muted">
                Drag to paint. Tap Sound to hear it on your phone.
              </p>
            </div>
            <button
              type="button"
              className="sin-btn shrink-0 !min-h-10 !px-2.5"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Collapse controls" : "Expand controls"}
            >
              {open ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <button
              type="button"
              className={cn(
                "sin-btn",
                settings.soundOn && "sin-btn-active",
              )}
              onClick={onToggleSound}
              aria-pressed={settings.soundOn}
              aria-label={settings.soundOn ? "Mute sound" : "Turn sound on"}
            >
              {settings.soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {settings.soundOn ? "Sound on" : "Sound"}
            </button>
            <button
              type="button"
              className={cn("sin-btn", settings.frozen && "sin-btn-active")}
              onClick={() => onChange({ frozen: !settings.frozen })}
              aria-pressed={settings.frozen}
            >
              {settings.frozen ? <Play size={16} /> : <Pause size={16} />}
              {settings.frozen ? "Unfreeze" : "Freeze"}
            </button>
            <button type="button" className="sin-btn" onClick={onRandomize}>
              <Dices size={16} />
              Randomize
            </button>
            <button type="button" className="sin-btn" onClick={onClear}>
              <Eraser size={16} />
              Clear
            </button>
            <button
              type="button"
              className="sin-btn sin-btn-primary col-span-2 sm:col-span-1"
              onClick={onExport}
            >
              <Download size={16} />
              Export
            </button>
          </div>

          {!settings.soundOn && (
            <p className="mt-2 text-[0.7rem] leading-snug text-flesh-raw">
              Phones start muted. Tap <strong>Sound</strong> once (then keep
              volume up) for heartbeat, wet drag, and flesh taps.
            </p>
          )}

          {open && (
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              <label className="block">
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-fg-muted">
                    Segments
                  </span>
                  <span className="font-display text-sm tabular-nums text-flesh-raw">
                    {settings.segments}
                  </span>
                </div>
                <input
                  className="sin-range"
                  type="range"
                  min={2}
                  max={24}
                  step={1}
                  value={settings.segments}
                  onChange={(e) =>
                    onChange({ segments: Number(e.target.value) })
                  }
                  aria-label="Segment count"
                />
              </label>

              <label className="block">
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-fg-muted">
                    Color mode
                  </span>
                </div>
                <select
                  className="sin-select"
                  value={settings.colorMode}
                  onChange={(e) =>
                    onChange({ colorMode: e.target.value as ColorModeId })
                  }
                  aria-label="Color mode"
                >
                  {COLOR_MODES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[0.7rem] leading-snug text-fg-subtle">
                  {COLOR_MODES.find((m) => m.id === settings.colorMode)
                    ?.description ?? ""}
                </p>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-fg-muted">
                      Wound size
                    </span>
                    <span className="font-display text-sm tabular-nums text-flesh-raw">
                      {settings.brushSize.toFixed(0)}
                    </span>
                  </div>
                  <input
                    className="sin-range"
                    type="range"
                    min={4}
                    max={48}
                    step={1}
                    value={settings.brushSize}
                    onChange={(e) =>
                      onChange({ brushSize: Number(e.target.value) })
                    }
                    aria-label="Brush size"
                  />
                </label>

                <label className="block">
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-fg-muted">
                      Memory
                    </span>
                    <span className="font-display text-sm tabular-nums text-flesh-raw">
                      {settings.trail.toFixed(0)}
                    </span>
                  </div>
                  <input
                    className="sin-range"
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={settings.trail}
                    onChange={(e) =>
                      onChange({ trail: Number(e.target.value) })
                    }
                    aria-label="Trail persistence"
                  />
                </label>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--color-blood)]"
                  checked={settings.symmetryFlip}
                  onChange={(e) =>
                    onChange({ symmetryFlip: e.target.checked })
                  }
                />
                <span className="text-xs text-fg-muted">
                  Alternate-segment flip (classic mirror)
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
