import { memo, useEffect, useState } from "react";

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

export const ProcessDuration = memo(
  ({ startTime, isRunning }: ProcessDurationProps) => {
    const [duration, setDuration] = useState("00:00:00");

    useEffect(() => {
      if (!startTime || !isRunning) {
        setDuration("00:00:00");
        return;
      }
      const updateDuration = () => {
        const now = new Date();
        const elapsed = now.getTime() - startTime.getTime();
        setDuration(formatDuration(elapsed));
      };
      updateDuration();
      const interval = setInterval(updateDuration, 1000);

      return () => clearInterval(interval);
    }, [startTime, isRunning]);

    if (!startTime || !isRunning) {
      return null;
    }

    return (
      <div className="text-xs text-gray-500 font-mono relative left-2">
        {duration}
      </div>
    );
  },
);
