import { For } from "solid-js";
import { Logo } from "@/components/ui";

const CIRCLES = 4;
const BASE_SIZE = 200;
const CIRCLE_DATA = Array.from({ length: CIRCLES }, (_, i) => ({
  size: BASE_SIZE + i * 80,
  opacity: 1 - i * 0.2,
}));

export const RippledLogo = () => {
  return (
    <div class="relative h-110 max-h-110 w-110 max-w-110 mx-auto">
      <div class="absolute inset-0 flex items-center justify-center">
        <For each={CIRCLE_DATA}>
          {(circle) => (
            <div
              class="absolute rounded-full bg-base-300"
              style={{
                width: `${circle.size}px`,
                height: `${circle.size}px`,
                opacity: circle.opacity,
              }}
            />
          )}
        </For>
        <div class="relative z-10 max-w-50">
          <Logo />
        </div>
      </div>
    </div>
  );
};
