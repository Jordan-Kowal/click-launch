import type React from "react";
import { memo } from "react";

export const Logo: React.FC = memo(() => {
  return <img data-testid="logo" src="/logo.png" alt="Click Launch Logo" />;
});
