import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/App";
import { LoadingRing } from "@/components/ui";

const container = document.getElementById("root") as HTMLDivElement;
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <React.Suspense fallback={<LoadingRing />}>
      <App />
    </React.Suspense>
  </React.StrictMode>,
);
