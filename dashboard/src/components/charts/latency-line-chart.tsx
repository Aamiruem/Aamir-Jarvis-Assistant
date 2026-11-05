"use client";

// D3 for the math (scales, line path, ticks), React for the DOM. This is the usual way to
// combine them: D3 never touches the DOM, so React stays in charge of rendering.
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

import { ChartCard } from "@/components/charts/chart-card";

interface Point {
  at: string;
  latencyMs: number;
}

const HEIGHT = 220;
const M = { top: 12, right: 12, bottom: 28, left: 44 };
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export function LatencyLineChart({ points }: { points: Point[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  // Measured from the container; the SVG itself is width:100%, so it never pushes the layout wider.
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const x = d3
    .scaleLinear()
    .domain([0, Math.max(1, points.length - 1)])
    .range([M.left, width - M.right]);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(points, (p) => p.latencyMs) ?? 1000])
    .nice()
    .range([HEIGHT - M.bottom, M.top]);
  const path = d3
    .line<Point>()
    .x((_, i) => x(i))
    .y((p) => y(p.latencyMs))
    .curve(d3.curveMonotoneX)(points);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.round(x.invert(e.clientX - box.left + M.left));
    setHover(Math.min(points.length - 1, Math.max(0, i)));
  };

  const p = hover != null ? points[hover] : null;
  const xTicks = points.length > 1 ? [0, Math.floor((points.length - 1) / 2), points.length - 1] : [0];

  return (
    <ChartCard
      title="Response time"
      description="How long Azarvis took to answer each of your recent messages"
      table={{ columns: ["Time", "Response (ms)"], rows: points.map((pt) => [fmtTime(pt.at), pt.latencyMs.toLocaleString()]) }}
    >
      <div ref={wrap} className="relative w-full min-w-0">
        <svg height={HEIGHT} role="img" aria-label="Line chart of response time per message" className="block w-full overflow-visible">
          {y.ticks(4).map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" />
              <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={12} fill="var(--viz-axis)">
                {t >= 1000 ? `${t / 1000}s` : `${t}ms`}
              </text>
            </g>
          ))}
          {xTicks.map((i) => (
            <text key={i} x={x(i)} y={HEIGHT - 8} textAnchor="middle" fontSize={12} fill="var(--viz-axis)">
              {points[i] ? fmtTime(points[i].at) : ""}
            </text>
          ))}
          <path d={width ? (path ?? "") : ""} fill="none" stroke="var(--viz-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {p && hover != null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={HEIGHT - M.bottom} stroke="var(--viz-axis)" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(p.latencyMs)} r={5} fill="var(--viz-1)" stroke="var(--card)" strokeWidth={2} />
            </g>
          )}
          {/* Hit area covers the whole plot, so the tooltip follows the pointer, not the thin line. */}
          <rect
            x={M.left}
            y={M.top}
            width={Math.max(0, width - M.left - M.right)}
            height={HEIGHT - M.top - M.bottom}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
        {p && hover != null && (
          <div
            className="pointer-events-none absolute top-0 rounded-md border bg-popover px-2 py-1 text-xs shadow-md"
            style={{ left: Math.min(x(hover) + 10, width - 120) }}
          >
            <div className="font-medium tabular-nums">{p.latencyMs.toLocaleString()} ms</div>
            <div className="text-muted-foreground">{fmtTime(p.at)}</div>
          </div>
        )}
      </div>
    </ChartCard>
  );
}
