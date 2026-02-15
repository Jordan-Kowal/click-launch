import { createEffect, onCleanup, onMount } from "solid-js";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import type { ResourceHistoryEntry } from "@/electron/types";
import { formatBytes } from "@/utils/formatters";

type ResourceChartProps = {
  history: () => ResourceHistoryEntry[];
  theme: () => "nord" | "forest";
  historyMinutes: () => number;
  sessionPeakMemory: () => number;
};

const MEMORY_STEP = 256 * 1024 * 1024; // 256 MB
const LEGEND_HEIGHT = 30;
const MIN_CHART_HEIGHT = 200;

const getThemeColor = (varName: string): string => {
  const el = document.createElement("div");
  el.style.color = `var(${varName})`;
  document.body.appendChild(el);
  const color = getComputedStyle(el).color;
  document.body.removeChild(el);
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return a < 255
    ? `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`
    : `rgb(${r},${g},${b})`;
};

const ceilMemoryScale = (bytes: number): number => {
  if (bytes <= 0) return MEMORY_STEP;
  return Math.ceil(bytes / MEMORY_STEP) * MEMORY_STEP;
};

const padTime = (n: number): string => String(n).padStart(2, "0");

const formatHHMM = (epochSec: number): string => {
  const d = new Date(epochSec * 1000);
  return `${padTime(d.getHours())}:${padTime(d.getMinutes())}`;
};

type ThemeColors = {
  cpuColor: string;
  memoryColor: string;
  baseContent: string;
  base300: string;
};

const resolveThemeColors = (): ThemeColors => ({
  cpuColor: getThemeColor("--color-info"),
  memoryColor: getThemeColor("--color-success"),
  baseContent: getThemeColor("--color-base-content"),
  base300: getThemeColor("--color-base-300"),
});

const buildOpts = (
  width: number,
  height: number,
  historyMinutes: number,
  memMax: number,
  colors: ThemeColors,
): uPlot.Options => {
  const nowSec = Math.floor(Date.now() / 1000);
  const minSec = nowSec - historyMinutes * 60;

  return {
    width,
    height,
    cursor: {
      drag: { setScale: false },
    },
    select: { show: false, left: 0, top: 0, width: 0, height: 0 },
    scales: {
      x: {
        auto: false,
        range: [minSec, nowSec],
      },
      cpu: {
        auto: false,
        range: [0, 100],
      },
      mem: {
        auto: false,
        range: [0, memMax],
      },
    },
    series: [
      {},
      {
        label: "CPU",
        stroke: colors.cpuColor,
        width: 2,
        scale: "cpu",
        value: (_u, v) => (v == null ? "-" : `${v.toFixed(1)}%`),
      },
      {
        label: "Memory",
        stroke: colors.memoryColor,
        width: 2,
        scale: "mem",
        value: (_u, v) => (v == null ? "-" : formatBytes(v)),
      },
    ],
    axes: [
      {
        stroke: colors.baseContent,
        space: 70,
        grid: { stroke: colors.base300, width: 1 },
        ticks: { stroke: colors.base300, width: 1 },
        values: (_u, ticks) => ticks.map(formatHHMM),
      },
      {
        scale: "cpu",
        side: 3,
        stroke: colors.baseContent,
        space: 40,
        values: (_u, ticks) => ticks.map((v) => `${v.toFixed(0)}%`),
        grid: { stroke: colors.base300, width: 1 },
        ticks: { stroke: colors.base300, width: 1 },
      },
      {
        scale: "mem",
        side: 1,
        stroke: colors.baseContent,
        size: 70,
        space: 40,
        values: (_u, ticks) => ticks.map((v) => formatBytes(v)),
        grid: { show: false },
        ticks: { stroke: colors.base300, width: 1 },
      },
    ],
  };
};

const historyToData = (
  history: ResourceHistoryEntry[],
): [number[], number[], number[]] => {
  const timestamps = new Array(history.length);
  const cpuValues = new Array(history.length);
  const memValues = new Array(history.length);

  for (let i = 0; i < history.length; i++) {
    timestamps[i] = Math.floor(history[i].timestamp / 1000);
    cpuValues[i] = Math.min(history[i].cpu, 100);
    memValues[i] = history[i].memoryBytes;
  }

  return [timestamps, cpuValues, memValues];
};

const chartHeight = (containerHeight: number): number =>
  Math.max((containerHeight || 400) - LEGEND_HEIGHT, MIN_CHART_HEIGHT);

export const ResourceChart = (props: ResourceChartProps) => {
  let wrapper!: HTMLDivElement;
  let chart: uPlot | null = null;
  let colors: ThemeColors | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let lastWidth = 0;
  let lastHeight = 0;

  const getMemMax = () => ceilMemoryScale(props.sessionPeakMemory());

  const buildChart = () => {
    if (chart) {
      chart.destroy();
      chart = null;
    }

    colors = resolveThemeColors();
    const width = wrapper.clientWidth;
    const height = chartHeight(wrapper.clientHeight);
    lastWidth = width;
    lastHeight = height;

    const opts = buildOpts(
      width,
      height,
      props.historyMinutes(),
      getMemMax(),
      colors,
    );
    const data = historyToData(props.history());
    chart = new uPlot(opts, data, wrapper);
  };

  onMount(() => {
    buildChart();

    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        const h = chartHeight(Math.round(entry.contentRect.height));
        if (w === lastWidth && h === lastHeight) return;
        lastWidth = w;
        lastHeight = h;
        chart?.setSize({ width: w, height: h });
      }
    });
    resizeObserver.observe(wrapper);
  });

  createEffect(() => {
    const history = props.history();
    if (!chart || !colors) return;

    // Update x-axis range and memory scale without rebuilding
    const nowSec = Math.floor(Date.now() / 1000);
    const minSec = nowSec - props.historyMinutes() * 60;
    chart.setScale("x", { min: minSec, max: nowSec });
    chart.setScale("mem", { min: 0, max: getMemMax() });
    chart.setData(historyToData(history));
  });

  createEffect(() => {
    props.theme();
    if (!wrapper) return;
    buildChart();
  });

  onCleanup(() => {
    resizeObserver?.disconnect();
    chart?.destroy();
  });

  return <div ref={wrapper!} class="flex-1 min-h-0" />;
};
