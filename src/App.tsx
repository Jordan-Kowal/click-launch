import { Router } from "@solidjs/router";
import { type Component, Suspense } from "solid-js";
import { Toaster } from "solid-toast";
import { LoadingRing } from "./components/ui";
import { AppStorageProvider } from "./contexts";
import { routes } from "./routes";

const App: Component = () => {
  return (
    <main class="min-w-full prose prose-sm md:prose-base">
      <AppStorageProvider>
        <Router
          root={(props) => (
            <Suspense fallback={<LoadingRing />}>{props.children}</Suspense>
          )}
        >
          {routes}
        </Router>
        <Toaster position="bottom-right" toastOptions={{ duration: 5000 }} />
      </AppStorageProvider>
    </main>
  );
};

export default App;
