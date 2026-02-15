import { ColorType, createChart, LineSeries } from "lightweight-charts";
import { createEffect, onCleanup, onMount } from "solid-js";
import type { ResourceHistoryEntry } from "@/electron/types";

type ResourceChartProps = {
  history: () => ResourceHistoryEntry[];
  theme: () => "nord" | "forest";
};

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

const MEMORY_STEP = 512 * 1024 * 1024; // 512 MB

const ceilMemoryScale = (bytes: number): number => {
  if (bytes <= 0) return MEMORY_STEP;
  return Math.ceil((bytes * 1.2) / MEMORY_STEP) * MEMORY_STEP;
};

const formatBytesShort = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exp = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const val = bytes / 1024 ** exp;
  return `${exp === 0 ? val : val.toFixed(1)} ${units[exp]}`;
};

const CHART_HEIGHT = 400;

export const LightweightResourceChart = (props: ResourceChartProps) => {
  let container!: HTMLDivElement;
  let chart: ReturnType<typeof createChart> | null = null;
  let cpuSeries: ReturnType<
    ReturnType<typeof createChart>["addSeries"]
  > | null = null;
  let memorySeries: ReturnType<
    ReturnType<typeof createChart>["addSeries"]
  > | null = null;
  let resizeObserver: ResizeObserver | null = null;

  const getColors = () => ({
    cpuColor: getThemeColor("--color-info"),
    memoryColor: getThemeColor("--color-success"),
    baseContent: getThemeColor("--color-base-content"),
    base300: getThemeColor("--color-base-300"),
  });

  const buildChart = () => {
    if (chart) {
      chart.remove();
      chart = null;
      cpuSeries = null;
      memorySeries = null;
    }

    const colors = getColors();

    chart = createChart(container, {
      width: container.clientWidth,
      height: CHART_HEIGHT,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: colors.baseContent,
        fontFamily: "system-ui, sans-serif",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: colors.base300 },
        horzLines: { color: colors.base300 },
      },
      leftPriceScale: {
        visible: true,
        borderColor: colors.base300,
        scaleMargins: { top: 0.02, bottom: 0 },
      },
      rightPriceScale: {
        visible: true,
        borderColor: colors.base300,
        scaleMargins: { top: 0.02, bottom: 0 },
      },
      timeScale: {
        visible: true,
        borderColor: colors.base300,
        timeVisible: true,
        secondsVisible: true,
        shiftVisibleRangeOnNewBar: true,
        ticksVisible: true,
      },
      crosshair: {
        vertLine: { color: colors.base300 },
        horzLine: { color: colors.base300 },
      },
    });

    cpuSeries = chart.addSeries(LineSeries, {
      color: colors.cpuColor,
      lineWidth: 2,
      priceScaleId: "left",
      title: "CPU %",
      priceFormat: {
        type: "custom",
        formatter: (price: number) =>
          `${Math.max(0, Math.min(100, price)).toFixed(1)}%`,
      },
    });

    memorySeries = chart.addSeries(LineSeries, {
      color: colors.memoryColor,
      lineWidth: 2,
      priceScaleId: "right",
      title: "Memory",
      priceFormat: {
        type: "custom",
        formatter: (price: number) =>
          price < 0 ? "0 B" : formatBytesShort(price),
      },
    });

    cpuSeries.applyOptions({
      autoscaleInfoProvider: () => ({
        priceRange: { minValue: 0, maxValue: 100 },
      }),
    });

    memorySeries.applyOptions({
      autoscaleInfoProvider: (
        original: () => {
          priceRange: { minValue: number; maxValue: number };
        } | null,
      ) => {
        const res = original();
        if (res) {
          return {
            priceRange: {
              minValue: 0,
              maxValue: ceilMemoryScale(res.priceRange.maxValue),
            },
          };
        }
        return res;
      },
    });

    updateData(props.history());

    // Workaround: fancy-canvas async ResizeObserver init may miss the
    // initial canvas size, leaving it at the default 300x150.
    const ref = chart;
    setTimeout(() => ref?.resize(container.clientWidth, CHART_HEIGHT), 150);
  };

  const updateData = (history: ResourceHistoryEntry[]) => {
    if (!cpuSeries || !memorySeries) return;

    const cpuData = history.map((e) => ({
      time: Math.floor(
        e.timestamp / 1000,
      ) as import("lightweight-charts").UTCTimestamp,
      value: Math.min(e.cpu, 100),
    }));

    const memoryData = history.map((e) => ({
      time: Math.floor(
        e.timestamp / 1000,
      ) as import("lightweight-charts").UTCTimestamp,
      value: e.memoryBytes,
    }));

    cpuSeries.setData(cpuData);
    memorySeries.setData(memoryData);
  };

  onMount(() => {
    buildChart();

    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart?.applyOptions({ width: entry.contentRect.width });
      }
    });
    resizeObserver.observe(container);
  });

  createEffect(() => {
    const history = props.history();
    updateData(history);
  });

  createEffect(() => {
    props.theme();
    if (!container) return;
    buildChart();
  });

  onCleanup(() => {
    resizeObserver?.disconnect();
    chart?.remove();
  });

  return <div ref={container!} />;
};
