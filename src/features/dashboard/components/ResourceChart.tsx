import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import type { ResourceHistoryEntry } from "@/types";
import { formatBytes } from "@/utils/formatters";

type ResourceChartProps = {
  history: () => ResourceHistoryEntry[];
  theme: () => "nord" | "forest";
  historyMinutes: () => number;
};

const MEMORY_STEP = 256 * 1024 * 1024; // 256 MB
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

const formatHHMMSS = (epochSec: number): string => {
  const d = new Date(epochSec * 1000);
  return `${padTime(d.getHours())}:${padTime(d.getMinutes())}:${padTime(d.getSeconds())}`;
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

type TooltipData = {
  left: number;
  top: number;
  time: string;
  cpu: string;
  mem: string;
};

const buildOpts = (
  width: number,
  height: number,
  historyMinutes: number,
  memMax: number,
  colors: ThemeColors,
  onCursor: (u: uPlot) => void,
): uPlot.Options => {
  const nowSec = Math.floor(Date.now() / 1000);
  const minSec = nowSec - historyMinutes * 60;

  return {
    width,
    height,
    legend: { show: false },
    cursor: { drag: { setScale: false } },
    hooks: { setCursor: [onCursor] },
    select: { show: false, left: 0, top: 0, width: 0, height: 0 },
    scales: {
      x: { auto: false, range: [minSec, nowSec] },
      cpu: { auto: false, range: [0, 100] },
      mem: { auto: false, range: [0, memMax] },
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
  Math.max(containerHeight || 400, MIN_CHART_HEIGHT);

export const ResourceChart = (props: ResourceChartProps) => {
  let wrapper!: HTMLDivElement;
  let tooltipEl!: HTMLDivElement;
  let chart: uPlot | null = null;
  let colors: ThemeColors | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let lastWidth = 0;
  let lastHeight = 0;

  const [tooltip, setTooltip] = createSignal<TooltipData | null>(null);

  const getMemMax = () => {
    let max = 0;
    for (const entry of props.history()) {
      if (entry.memoryBytes > max) max = entry.memoryBytes;
    }
    return ceilMemoryScale(max);
  };

  const onCursor = (u: uPlot) => {
    const { left, top, idx } = u.cursor;
    if (idx == null || left == null || top == null || left < 0) {
      setTooltip(null);
      return;
    }
    const dataLen = u.data[0].length;
    if (
      dataLen === 0 ||
      u.posToVal(left, "x") < u.data[0][0] ||
      u.posToVal(left, "x") > u.data[0][dataLen - 1]
    ) {
      setTooltip(null);
      return;
    }
    const cpu = u.data[1][idx];
    const mem = u.data[2][idx];

    // Diagonal positioning: top-right, flip down if no room above
    const ttH = tooltipEl?.offsetHeight ?? 50;
    const ttW = tooltipEl?.offsetWidth ?? 100;
    let posLeft = left;
    if (posLeft + ttW > u.over.clientWidth) posLeft = left - ttW;
    let posTop = top - ttH;
    if (posTop < 0) posTop = top + 40;

    setTooltip({
      left: posLeft,
      top: posTop,
      time: formatHHMMSS(u.data[0][idx]),
      cpu: cpu != null ? `${cpu.toFixed(1)}%` : "-",
      mem: mem != null ? formatBytes(mem) : "-",
    });
  };

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
      onCursor,
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

  return (
    <div class="relative flex-1 min-h-0">
      <div ref={wrapper!} class="absolute inset-0" />
      <Show when={tooltip()}>
        {(tt) => (
          <div
            ref={tooltipEl!}
            class="absolute z-10 pointer-events-none whitespace-pre rounded-md border border-base-300 bg-base-100/90 px-2.5 py-1.5 text-xs shadow-lg"
            style={{
              left: `${tt().left}px`,
              top: `${tt().top}px`,
            }}
          >
            <div class="font-semibold">{tt().time}</div>
            <div>CPU: {tt().cpu}</div>
            <div>Mem: {tt().mem}</div>
          </div>
        )}
      </Show>
    </div>
  );
};
