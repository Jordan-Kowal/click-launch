import { type Component, type JSX, Suspense } from "solid-js";
import { DEFAULT_THEME } from "./config/daisyui";

type AppProps = {
  children: JSX.Element;
};

const App: Component<AppProps> = (props) => {
  return (
    <div
      data-theme={DEFAULT_THEME}
      class="min-w-full prose prose-sm md:prose-base"
    >
      <main>
        <Suspense>{props.children}</Suspense>
      </main>
    </div>
  );
};

export default App;
