import { createSignal, onMount } from "solid-js";

export const Logo = () => {
  const [logoSrc, setLogoSrc] = createSignal("/logo.png");

  onMount(() => {
    if (window.electronAPI?.getResourcePath) {
      const result = window.electronAPI.getResourcePath("logo.png");
      if (result?.then) {
        result.then((path: string) => {
          setLogoSrc(path);
        });
      }
    }
  });

  return <img src={logoSrc()} alt="Click Launch Logo" />;
};
