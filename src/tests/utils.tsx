import { Toaster } from "@/components/ui";
import "@/config/dayjs";
import {
  type RenderHookResult,
  render,
  renderHook,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { AppStorageProvider, ThemeProvider } from "@/contexts";

const wrapComponent = (children: ReactNode) => (
  <ThemeProvider>
    <AppStorageProvider>
      {children}
      <Toaster />
    </AppStorageProvider>
  </ThemeProvider>
);

type ImprovedRender = (
  node: Parameters<typeof render>[0],
) => ReturnType<typeof render>;

const improvedRender: ImprovedRender = (node) =>
  render(node, { wrapper: ({ children }) => wrapComponent(children) });

type ImprovedRenderHook = <TProps, TResult>(
  hook: (props: TProps) => TResult,
) => RenderHookResult<TResult, TProps>;

const improvedRenderHook: ImprovedRenderHook = (hook) =>
  renderHook(hook, {
    wrapper: ({ children }) => wrapComponent(children),
  });

export { improvedRender as render, improvedRenderHook as renderHook };
