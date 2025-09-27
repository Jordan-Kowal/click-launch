import { Router } from "@solidjs/router";
import { type Component, Suspense } from "solid-js";
import { LoadingRing } from "./components/ui";
import { DEFAULT_THEME } from "./config/daisyui";
import { AppStorageProvider } from "./contexts";
import { routes } from "./routes";

const App: Component = () => {
  return (
    <main
      data-theme={DEFAULT_THEME}
      class="min-w-full prose prose-sm md:prose-base"
    >
      <AppStorageProvider>
        <Router
          root={(props) => (
            <Suspense fallback={<LoadingRing />}>{props.children}</Suspense>
          )}
        >
          {routes}
        </Router>
      </AppStorageProvider>
    </main>
  );
};

export default App;
