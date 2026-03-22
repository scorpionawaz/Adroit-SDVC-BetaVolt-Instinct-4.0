"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, Bot } from "lucide-react";

// ── Phases ───────────────────────────────────────────────
type Phase =
  | "idle"         // not active
  | "p1_sidebar"   // sidebar collapses (handled by parent)
  | "p2_cards"     // center 4 device cards fade
  | "p3_edges"     // remaining edge cards + text fade
  | "p4_cleanup"   // stat-row slides up, blank white canvas
  | "p5_dot"       // tiny dot appears
  | "p6_expand"    // dot swells to full orb
  | "p7_active";   // voice UI fully revealed

interface AgentModeProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Utility: staggered delay helper ──────────────────────
function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Wave bars (react to audio level) ─────────────────────
function WaveBar({ audioLevel, i }: { audioLevel: number; i: number }) {
  const base = 6;
  const peak = Math.sin((Date.now() / 200 + i * 0.7)) * audioLevel * 28 + base;
  return (
    <div
      className="w-[3px] rounded-full bg-white/90"
      style={{ height: `${Math.max(base, peak)}px`, transition: "height 90ms ease-out" }}
    />
  );
}

// ── Pulsing orbit ring ────────────────────────────────────
function Ring({ size, delay, audioLevel }: { size: number; delay: number; audioLevel: number }) {
  const boost = 1 + audioLevel * 0.18;
  return (
    <span
      className="absolute rounded-full border border-emerald-400/40 pointer-events-none"
      style={{
        width:  size * boost,
        height: size * boost,
        top:    "50%",
        left:   "50%",
        transform: "translate(-50%,-50%)",
        animation: `agentPing ${2 + delay}s cubic-bezier(0,0,0.2,1) infinite`,
        animationDelay: `${delay * 0.5}s`,
        transition: "all 90ms ease-out",
      }}
    />
  );
}

// ── Main component ────────────────────────────────────────
export function AgentMode({ isOpen, onClose }: AgentModeProps) {
  const [phase, setPhase]       = useState<Phase>("idle");
  const [audioLevel, setAudio]  = useState(0);
  const [dotBig, setDotBig]     = useState(false);
  const [voiceVisible, setVoice] = useState(false);
  const ticker = useRef<NodeJS.Timeout | null>(null);
  const running = useRef(false);

  // ESC handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Simulated speaking audio
  useEffect(() => {
    if (phase === "p7_active" || phase === "p6_expand") {
      ticker.current = setInterval(() => {
        setAudio(Math.random() > 0.3 ? Math.random() * 0.85 + 0.1 : Math.random() * 0.05);
      }, 110);
    } else {
      if (ticker.current) clearInterval(ticker.current);
      setAudio(0);
    }
    return () => { if (ticker.current) clearInterval(ticker.current); };
  }, [phase]);

  // Sequence runner
  useEffect(() => {
    if (!isOpen) {
      setPhase("idle");
      setDotBig(false);
      setVoice(false);
      running.current = false;
      return;
    }

    running.current = true;

    (async () => {
      setPhase("p1_sidebar"); await wait(700);  // sidebar collapses outside
      if (!running.current) return;
      setPhase("p2_cards");   await wait(900);  // center 4 fade
      if (!running.current) return;
      setPhase("p3_edges");   await wait(900);  // edge 4 fade
      if (!running.current) return;
      setPhase("p4_cleanup"); await wait(800);  // stat row slides up → blank
      if (!running.current) return;
      setPhase("p5_dot");     await wait(400);  // dot appears
      if (!running.current) return;
      setPhase("p6_expand");  await wait(200);  // start expanding
      setDotBig(true);        await wait(700);  // dot reaches full size
      if (!running.current) return;
      setVoice(true);         await wait(300);
      if (!running.current) return;
      setPhase("p7_active");
    })();
  }, [isOpen]);

  const handleClose = useCallback(() => {
    running.current = false;
    onClose();
  }, [onClose]);

  if (!isOpen && phase === "idle") return null;

  // Which phase number are we in?
  const phaseNum: Record<Phase, number> = {
    idle: 0, p1_sidebar: 1, p2_cards: 2, p3_edges: 3,
    p4_cleanup: 4, p5_dot: 5, p6_expand: 6, p7_active: 7,
  };
  const p = phaseNum[phase];

  // ── Ghost device card grid (8 cards, represents the device grid) ──
  // Cards 2,3,4,5 (0‑indexed) = centre → fade first (p2)
  // Cards 0,1,6,7              = edges → fade second (p3)
  const cardOpacity = (i: number): number => {
    const center = i >= 2 && i <= 5;
    if (p >= 3 && !center) return 0; // edge fade
    if (p >= 2 && center)  return 0; // center fade
    return 1;
  };
  const cardScale = (i: number): number => {
    const center = i >= 2 && i <= 5;
    if (p >= 3 && !center) return 0.85;
    if (p >= 2 && center)  return 0.85;
    return 1;
  };
  const cardDelay = (i: number): number => {
    // within the same group, stagger left-to-right
    return [60, 120, 0, 40, 80, 120, 0, 60][i] ?? 0;
  };

  return (
    <>
      {/* ── Solid full-screen backdrop ── */}
      <div
        className={cn(
          "fixed inset-0 z-[9990]",
          "bg-[#0a0f1a]",
          "transition-opacity duration-700 ease-out",
          p >= 1 ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />

      {/* ── Content stage ── */}
      <div
        className={cn(
          "fixed inset-0 z-[9991] flex flex-col",
          p >= 1 ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        {/* ─ Ghost stat row (slides up off-screen in p4) ─ */}
        <div
          className={cn(
            "flex gap-4 px-8 pt-8 pb-4",
            "transition-all duration-700 ease-in-out",
            p >= 4 ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100",
          )}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex-1 h-24 rounded-xl border-2 border-slate-700 bg-slate-800 animate-pulse"
            />
          ))}
        </div>

        {/* ─ Ghost device grid (fades out in stages) ─ */}
        <div
          className={cn(
            "flex-1 mx-8 mb-8 rounded-2xl border-2 border-slate-700 overflow-hidden",
            "bg-slate-900",
            "transition-all duration-700",
          )}
        >
          {/* Grid of ghost device cards */}
          <div
            className={cn(
              "grid grid-cols-4 gap-4 p-6 h-full content-start",
              "transition-opacity duration-500",
              p >= 4 ? "opacity-0" : "opacity-100",
            )}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-xl border-2 border-slate-700 bg-slate-800 p-3 flex flex-col gap-2"
                style={{
                  opacity: cardOpacity(i),
                  transform: `scale(${cardScale(i)})`,
                  transition: `opacity 500ms ease-out ${cardDelay(i)}ms, transform 500ms ease-out ${cardDelay(i)}ms`,
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700" />
                <div className="w-16 h-2 rounded bg-slate-700" />
                <div className="w-10 h-2 rounded bg-slate-800" />
                <div className="mt-auto flex items-center justify-between">
                  <div className="w-12 h-5 rounded-full bg-slate-700" />
                  <div className="w-8 h-4 rounded bg-slate-700" />
                </div>
              </div>
            ))}
          </div>

          {/* overflow-hidden keeps ghost cards clipped */}
        </div>

        {/* ─ DOT → ORB reveal: positioned over the whole stage ─ */}
        {p >= 5 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 pointer-events-none">
            {/* The expanding circle */}
            <div
              className={cn(
                "relative flex items-center justify-center rounded-full",
                "bg-gradient-to-br from-emerald-400 to-emerald-700",
              )}
              style={{
                width:  dotBig ? 220 : 8,
                height: dotBig ? 220 : 8,
                boxShadow: dotBig
                  ? `0 0 ${50 + audioLevel * 60}px ${10 + audioLevel * 20}px rgba(52,211,153,0.35)`
                  : "none",
                transition: "width 700ms cubic-bezier(0.34,1.56,0.64,1), height 700ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 90ms ease-out",
              }}
            >
              {/* Orbit rings */}
              {voiceVisible && (
                <>
                  <Ring size={290} delay={0}   audioLevel={audioLevel} />
                  <Ring size={370} delay={0.7} audioLevel={audioLevel} />
                  <Ring size={460} delay={1.4} audioLevel={audioLevel} />
                </>
              )}

              {/* Inner face */}
              <div
                className={cn(
                  "flex flex-col items-center gap-2 z-10",
                  "transition-opacity duration-500",
                  voiceVisible ? "opacity-100" : "opacity-0",
                )}
              >
                <Bot
                  className="h-10 w-10 text-white drop-shadow"
                  style={{ transform: `scale(${1 + audioLevel * 0.12})`, transition: "transform 90ms ease-out" }}
                />

                {/* Audio wave bars */}
                <div className="flex items-center gap-[3px]" style={{ height: 36 }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <WaveBar key={i} audioLevel={audioLevel} i={i} />
                  ))}
                </div>
              </div>
            </div>

            {/* Label */}
            {phase === "p7_active" && (
              <div
                className="flex flex-col items-center gap-1.5 pointer-events-auto"
                style={{ animation: "agentFadeIn 0.5s ease both" }}
              >
                <p className="text-slate-100 text-xl font-bold tracking-wide">
                  BetaVolt Agent
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Speaking…
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Press{" "}
                  <kbd className="bg-slate-800 border-slate-700 border rounded px-1.5 py-0.5 font-mono text-[11px]">
                    ESC
                  </kbd>{" "}
                  to exit Agent Mode
                </p>
              </div>
            )}
          </div>
        )}

      {/* ── Exit button ── */}
      {p >= 7 && (
        <button
          onClick={handleClose}
          className={cn(
            "fixed top-6 right-6 z-[9999]",
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-slate-900/80 hover:bg-red-600 backdrop-blur-sm",
            "text-white text-sm font-semibold",
            "border border-slate-700 hover:border-red-500",
            "transition-all duration-200 hover:scale-105",
            "shadow-lg",
          )}
          style={{ animation: "agentFadeIn 0.4s ease both" }}
        >
          <X className="h-4 w-4" />
          Exit Agent Mode
        </button>
      )}
      </div> {/* end content stage */}
    </>
  );
}
