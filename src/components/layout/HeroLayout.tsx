import type { JSX } from "solid-js";
import { FadeIn } from "../ui";
import { NAVBAR_HEIGHT } from "./constants";
import { NavBar } from "./NavBar";

export type MainProps = {
  children: JSX.Element;
  class?: string;
};

export const HeroLayout = (props: MainProps) => {
  return (
    <main
      class={`hero w-full ${props.class || ""}`}
      style={{
        "min-height": `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        "margin-top": `${NAVBAR_HEIGHT}px`,
      }}
    >
      <NavBar />
      <div class="hero-content w-full">
        <div class="max-w-6xl w-full ">
          <FadeIn>{props.children}</FadeIn>
        </div>
      </div>
    </main>
  );
};
