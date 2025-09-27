import { Router } from "@solidjs/router";
import { type Component, Suspense } from "solid-js";
import { DEFAULT_THEME } from "./config/daisyui";
import { routes } from "./routes";

const App: Component = () => {
  return (
    <main
      data-theme={DEFAULT_THEME}
      class="min-w-full prose prose-sm md:prose-base"
    >
      <Router root={(props) => <Suspense>{props.children}</Suspense>}>
        {routes}
      </Router>
    </main>
  );
};

export default App;
