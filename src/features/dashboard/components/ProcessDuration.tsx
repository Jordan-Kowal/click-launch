import { createEffect, createSignal, onCleanup, Show } from "solid-js";

type ProcessDurationProps = {
  startTime: Date | null;
  isRunning: boolean;
};

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const ProcessDuration = (props: ProcessDurationProps) => {
  const [duration, setDuration] = createSignal("00:00:00");

  createEffect(() => {
    if (!props.startTime || !props.isRunning) {
      setDuration("00:00:00");
      return;
    }

    const updateDuration = () => {
      const now = new Date();
      const elapsed = now.getTime() - props.startTime!.getTime();
      setDuration(formatDuration(elapsed));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <Show when={props.startTime && props.isRunning}>
      <div class="text-xs text-gray-500 font-mono relative left-2">
        {duration()}
      </div>
    </Show>
  );
};
