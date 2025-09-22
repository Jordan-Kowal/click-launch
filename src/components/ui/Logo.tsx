import type React from "react";
import { memo, useEffect, useState } from "react";

export const Logo: React.FC = memo(() => {
  const [logoSrc, setLogoSrc] = useState("/logo.png");

  useEffect(() => {
    if (window.electronAPI?.getResourcePath) {
      const result = window.electronAPI.getResourcePath("logo.png");
      if (result?.then) {
        result.then((path: string) => {
          setLogoSrc(path);
        });
      }
    }
  }, []);

  return <img data-testid="logo" src={logoSrc} alt="Click Launch Logo" />;
});
