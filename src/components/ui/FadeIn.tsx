import { createSignal, type JSX, onMount } from "solid-js";

export type FadeInProps = {
  children: JSX.Element;
};

export const FadeIn = (props: FadeInProps) => {
  const [isVisible, setIsVisible] = createSignal(false);

  onMount(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  });

  const opacityClass = () => (isVisible() ? "opacity-100" : "opacity-0");

  return (
    <div class={`transition-opacity duration-1500 ${opacityClass()}`}>
      {props.children}
    </div>
  );
};
