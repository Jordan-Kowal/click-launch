import type React from "react";
import { memo } from "react";

const style = { width: "60px" };

export const LoadingRing: React.FC = memo(() => {
  return (
    <div className="flex flex-col items-center justify-center">
      <span
        data-testid="loading-ring"
        className="loading loading-ring mx-auto"
        style={style}
      />
      <span className="text-sm">Loading...</span>
    </div>
  );
});
