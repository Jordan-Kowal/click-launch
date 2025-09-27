import type { JSX } from "solid-js";
import { FadeIn } from "../ui";
import { NAVBAR_HEIGHT } from "./constants";
import { NavBar } from "./NavBar";

export type BaseLayoutProps = {
  children: JSX.Element;
  class?: string;
};

export const BaseLayout = (props: BaseLayoutProps) => {
  return (
    <main class={`flex flex-col w-full h-screen p-6 ${props.class || ""}`}>
      <NavBar />
      <div
        class="flex-1 w-full"
        style={{
          "margin-top": `${NAVBAR_HEIGHT}px`,
          height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        }}
      >
        <FadeIn>{props.children}</FadeIn>
      </div>
    </main>
  );
};
