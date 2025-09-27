import { Toaster as SolidToaster } from "solid-toast";

export const Toaster = () => {
  return (
    <SolidToaster
      position="bottom-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: "var(--fallback-b1,oklch(var(--b1)))",
          color: "var(--fallback-bc,oklch(var(--bc)))",
        },
      }}
    />
  );
};